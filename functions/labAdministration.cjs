const { createHash } = require('node:crypto');

const text = (value) => (typeof value === 'string' ? value.trim() : '');
const values = (value) => (Array.isArray(value) ? value : []);
const digest = (...parts) =>
  createHash('sha256').update(JSON.stringify(parts)).digest('hex');

function toleranceForLab(lab) {
  const minutes = lab?.lateToleranceMinutes;
  return Number.isInteger(minutes) && minutes >= 0 && minutes <= 120
    ? minutes
    : 15;
}

function sessionRoster(group, labId, assignments) {
  const participantIds = new Set(values(group.participantIds));
  const assistantIds = new Set(values(group.assistantIds));
  for (const assignment of assignments) {
    if (assignment.assignmentType === 'participant') {
      if (assignment.labId === labId) participantIds.add(assignment.userId);
      else participantIds.delete(assignment.userId);
    } else if (
      assignment.labId === labId &&
      assignment.assignmentType === 'assistant'
    ) {
      assistantIds.add(assignment.userId);
    }
  }
  return {
    participantIds: [...participantIds],
    assistantIds: [...assistantIds],
  };
}

function createLabAdministration({ db, auth, FieldValue, HttpsError }) {
  const labs = db.collection('labs');
  const users = db.collection('users');
  const classes = db.collection('classes');
  const sessions = db.collection('sessions');
  const assignments = db.collection('labAssignments');

  function fail(code, message, reason) {
    throw new HttpsError(code, message, reason ? { reason } : undefined);
  }

  function uidOf(request) {
    const uid = request.auth?.uid;
    if (!uid) fail('unauthenticated', 'Silakan masuk terlebih dahulu.');
    return uid;
  }

  function docId(value) {
    const id = text(value);
    if (!id || id.includes('/') || /^\.{1,2}$/.test(id) || id.length > 128) {
      fail('invalid-argument', 'ID dokumen tidak valid.');
    }
    return id;
  }

  function requireCourse(actor, courseId) {
    if (
      actor?.role !== 'lab_assistant' ||
      !text(courseId) ||
      !values(actor.managedCourseIds).includes(courseId)
    ) {
      fail('permission-denied', 'Anda tidak ditugaskan pada mata kuliah ini.');
    }
  }

  async function readLab(tx, actor, labId, active = true) {
    const ref = labs.doc(labId);
    const snapshot = await tx.get(ref);
    if (!snapshot.exists) fail('not-found', 'Laboratorium tidak ditemukan.');
    const lab = snapshot.data();
    requireCourse(actor, lab.courseId);
    if (active && lab.isActive !== true) {
      fail('failed-precondition', 'Laboratorium tujuan tidak aktif.');
    }
    return { ref, lab };
  }

  function matchingCourse(lab, group) {
    if (!lab.courseId) return true;
    const code = text(group.courseCode);
    return code === lab.courseId || (code && code === text(lab.courseCode));
  }

  async function resolveUser(tx, identifier, role) {
    const value = text(identifier);
    if (!value || value.length > 254) {
      fail('invalid-argument', 'Masukkan email atau NIM yang valid.');
    }
    if (value.includes('@')) {
      let account;
      try {
        account = await auth.getUserByEmail(value.toLowerCase());
      } catch (error) {
        if (
          error?.code === 'auth/user-not-found' ||
          error?.code === 'auth/invalid-email'
        ) {
          fail('not-found', 'Akun dengan peran yang sesuai tidak ditemukan.');
        }
        throw error;
      }
      const profile = await tx.get(users.doc(account.uid));
      if (account.disabled || profile.get('role') !== role) {
        fail('not-found', 'Akun dengan peran yang sesuai tidak ditemukan.');
      }
      return profile;
    }
    const identityQuery = users.where('nim', '==', value.toUpperCase());
    const snapshot = await tx.get(
      identityQuery.where('role', '==', role).limit(2),
    );
    if (snapshot.empty)
      fail('not-found', 'Akun dengan peran yang sesuai tidak ditemukan.');
    if (snapshot.size !== 1)
      fail('failed-precondition', 'Identitas belum unik. Gunakan email akun.');
    return snapshot.docs[0];
  }

  async function labRosterDocs(tx, labId, lab, field, userId, remove) {
    const [scheduled, groups] = await Promise.all([
      tx.get(
        sessions
          .where('labId', '==', labId)
          .where('status', '==', 'scheduled')
          .limit(451),
      ),
      tx.get(classes.where('labId', '==', labId).limit(451)),
    ]);
    const related = [...scheduled.docs, ...groups.docs].filter((item) => {
      const data = item.data();
      const correctCourse = !text(data.courseCode) || matchingCourse(lab, data);
      return correctCourse && (!remove || values(data[field]).includes(userId));
    });
    if (scheduled.size > 450 || groups.size > 450) {
      fail(
        'resource-exhausted',
        'Terlalu banyak sesi atau kelas untuk satu perubahan.',
      );
    }
    return related;
  }

  async function changeLabAssignment(request) {
    const actorUid = uidOf(request);
    const {
      action,
      identifier,
      labId: rawLab,
      fromLabId: rawSource,
    } = request.data ?? {};
    if (!['participant', 'assistant', 'move'].includes(action)) {
      fail('invalid-argument', 'Jenis penempatan tidak valid.');
    }
    const labId = docId(rawLab);
    const sourceId = action === 'move' ? docId(rawSource) : null;
    if (sourceId === labId)
      fail('invalid-argument', 'Pilih lab tujuan yang berbeda.');
    const kind = action === 'assistant' ? 'assistant' : 'participant';
    const role = kind === 'assistant' ? 'assistant' : 'student';

    return db.runTransaction(async (tx) => {
      const actor = (await tx.get(users.doc(actorUid))).data();
      const { lab } = await readLab(tx, actor, labId);
      const source = sourceId
        ? await readLab(tx, actor, sourceId, false)
        : null;
      if (source && source.lab.courseId !== lab.courseId) {
        fail(
          'failed-precondition',
          'Pemindahan hanya berlaku dalam mata kuliah yang sama.',
        );
      }
      const user = await resolveUser(tx, identifier, role);
      const ref = assignments.doc(
        digest(kind, kind === 'assistant' ? labId : lab.courseId, user.id),
      );
      const previous = (await tx.get(ref)).data();
      const field = kind === 'assistant' ? 'assistantIds' : 'participantIds';
      if (source && previous?.labId !== sourceId) {
        fail('failed-precondition', 'Praktikan tidak terdaftar pada lab asal.');
      }
      if (!source && previous && previous.labId !== labId) {
        fail(
          'failed-precondition',
          'Praktikan sudah ditempatkan. Gunakan fitur pemindahan lab.',
        );
      }
      const [targetDocs, sourceDocs] = await Promise.all([
        labRosterDocs(tx, labId, lab, field, user.id, false),
        source
          ? labRosterDocs(tx, sourceId, source.lab, field, user.id, true)
          : [],
      ]);
      if (targetDocs.length + sourceDocs.length > 450) {
        fail(
          'resource-exhausted',
          'Terlalu banyak roster untuk satu perubahan.',
        );
      }

      tx.set(ref, {
        courseId: lab.courseId,
        labId,
        userId: user.id,
        assignmentType: kind,
        updatedBy: actorUid,
        updatedAt: FieldValue.serverTimestamp(),
      });
      for (const item of targetDocs) {
        tx.update(item.ref, { [field]: FieldValue.arrayUnion(user.id) });
      }
      for (const item of sourceDocs) {
        tx.update(item.ref, { [field]: FieldValue.arrayRemove(user.id) });
      }
      return { uid: user.id, labId };
    });
  }

  async function importLab(request) {
    const actorUid = uidOf(request);
    const { courseId: rawCourse, input } = request.data ?? {};
    const courseId = text(rawCourse);
    const name = text(input?.name);
    const building = text(input?.building);
    const description = text(input?.description);
    const { latitude, longitude, radiusMeters, isActive } = input ?? {};
    if (
      !name ||
      name.length > 160 ||
      !building ||
      building.length > 160 ||
      description.length > 1000 ||
      !Number.isFinite(latitude) ||
      Math.abs(latitude) > 90 ||
      !Number.isFinite(longitude) ||
      Math.abs(longitude) > 180 ||
      !Number.isInteger(radiusMeters) ||
      radiusMeters < 10 ||
      radiusMeters > 500 ||
      typeof isActive !== 'boolean'
    ) {
      fail(
        'invalid-argument',
        'Data lab, koordinat, atau radius presensi tidak valid.',
      );
    }

    return db.runTransaction(async (tx) => {
      requireCourse((await tx.get(users.doc(actorUid))).data(), courseId);
      const known = await tx.get(
        labs.where('courseId', '==', courseId).where('name', '==', name),
      );
      const sameBuilding = known.docs.filter(
        (item) =>
          text(item.get('building')).toLowerCase() === building.toLowerCase(),
      );
      if (sameBuilding.length > 1) {
        fail(
          'failed-precondition',
          'Ada beberapa lab dengan nama dan gedung yang sama.',
        );
      }
      const ref =
        sameBuilding[0]?.ref ??
        labs.doc(
          'import_' +
            digest(courseId, name.toLowerCase(), building.toLowerCase()),
        );
      const existing = (await tx.get(ref)).data();
      if (existing && existing.courseId !== courseId) {
        fail(
          'permission-denied',
          'Lab berada di luar mata kuliah yang ditugaskan.',
        );
      }
      const now = new Date().toISOString();
      const payload = {
        courseId,
        name,
        building,
        description: description || null,
        location: { latitude, longitude },
        radiusMeters,
        isActive,
        updatedAt: now,
      };
      if (existing) tx.update(ref, payload);
      else
        tx.create(ref, {
          ...payload,
          courseCode: courseId,
          createdBy: actorUid,
          createdAt: now,
        });
      return { labId: ref.id };
    });
  }

  async function deleteLabSafely(request) {
    const actorUid = uidOf(request);
    const labId = docId(request.data?.labId);
    return db.runTransaction(async (tx) => {
      const actor = (await tx.get(users.doc(actorUid))).data();
      const { ref, lab } = await readLab(tx, actor, labId, false);
      const checks = [
        sessions.where('labId', '==', labId).limit(1),
        classes.where('labId', '==', labId).limit(1),
        assignments.where('labId', '==', labId).limit(1),
      ];
      if (text(lab.name)) {
        checks.push(sessions.where('lab', '==', lab.name));
      }
      const results = await Promise.all(checks.map((q) => tx.get(q)));
      const exactReference = results
        .slice(0, 3)
        .some((result) => !result.empty);
      const legacyReference = results[3]?.docs.some(
        (item) => !text(item.get('labId')),
      );
      if (exactReference || legacyReference) {
        fail(
          'failed-precondition',
          'Lab masih tercatat pada sesi, kelas, atau penempatan. Nonaktifkan untuk menjaga riwayat.',
          'lab_in_use',
        );
      }
      tx.delete(ref);
      return { ok: true };
    });
  }

  async function getLabSessionRoster(request) {
    const actorUid = uidOf(request);
    const labId = docId(request.data?.labId);
    const classId = docId(request.data?.classId);
    const [actor, group, lab] = await db.getAll(
      users.doc(actorUid),
      classes.doc(classId),
      labs.doc(labId),
    );
    if (
      !['assistant', 'lab_assistant'].includes(actor.get('role')) ||
      !values(group.get('assistantIds')).includes(actorUid)
    ) {
      fail('permission-denied', 'Anda tidak ditugaskan pada kelas ini.');
    }
    if (!lab.exists || lab.get('isActive') !== true) {
      fail('failed-precondition', 'Pilih laboratorium yang aktif.');
    }
    if (!matchingCourse(lab.data(), group.data())) {
      fail(
        'failed-precondition',
        'Laboratorium berasal dari mata kuliah lain.',
      );
    }
    const courseId = text(lab.get('courseId'));
    const docs = courseId
      ? (await assignments.where('courseId', '==', courseId).get()).docs
      : [];
    return {
      ...sessionRoster(
        group.data(),
        labId,
        docs.map((doc) => doc.data()),
      ),
      toleranceMinutes: toleranceForLab(lab.data()),
      courseCode: text(group.get('courseCode')),
    };
  }

  async function refreshScheduledRoster(tx, session, lab) {
    const course = text(lab?.courseId);
    if (session.status !== 'scheduled' || !course) return {};
    const result = await tx.get(assignments.where('courseId', '==', course));
    return sessionRoster(
      session,
      session.labId,
      result.docs.map((doc) => doc.data()),
    );
  }

  return {
    importLab,
    changeLabAssignment,
    deleteLabSafely,
    getLabSessionRoster,
    refreshScheduledRoster,
  };
}

module.exports = { createLabAdministration, sessionRoster, toleranceForLab };
