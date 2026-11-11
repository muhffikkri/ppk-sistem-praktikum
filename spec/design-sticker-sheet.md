<!DOCTYPE html>

<html lang="id"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" name="viewport"/>
<title>LabPresensi — Design System &amp; Component Sticker Sheet</title>
<!-- Tailwind CSS v3 CDN with Forms & Container Queries -->
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<!-- Google Fonts: Fraunces (Editorial Display Serif) & Plus Jakarta Sans (Clean Modern Sans) -->
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,400;1,9..144,600&amp;family=Plus+Jakarta+Sans:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<!-- Phosphor Icons for Crisp UI Glyphs -->
<script src="https://unpkg.com/@phosphor-icons/web"></script>
<!-- Tailwind Configuration for Sebenza-Style Color System -->
<script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            brand: {
              violet: '#5B3BE8',
              'violet-dark': '#4427C6',
              'violet-light': '#7356F5',
              lime: '#D3F36B',
              'lime-hover': '#C0E255',
              lavender: '#E4DBFF',
              'lavender-subtle': '#F3EFFF',
              pink: '#FFC2D9',
              ink: '#17141F',
              'ink-muted': '#5D586C',
              surface: '#F4F2F9',
              panel: '#FFFFFF',
              border: '#E7E3F2',
              'border-subtle': '#F0EDF7'
            }
          },
          fontFamily: {
            serif: ['Fraunces', 'serif'],
            sans: ['"Plus Jakarta Sans"', 'sans-serif']
          },
          borderRadius: {
            '2xl': '18px',
            '3xl': '24px',
            '4xl': '32px'
          },
          boxShadow: {
            'subtle': '0 4px 20px -2px rgba(23, 20, 31, 0.05)',
            'elevated': '0 12px 32px -4px rgba(91, 59, 232, 0.12)',
            'card': '0 2px 10px rgba(0, 0, 0, 0.02), 0 0 1px rgba(0,0,0,0.06)'
          }
        }
      }
    }
  </script>
<!-- Global & Custom Component Styles -->
<style data-purpose="custom-typography">
    .font-editorial-italic {
      font-family: 'Fraunces', serif;
      font-style: italic;
      letter-spacing: -0.02em;
    }
    .font-editorial {
      font-family: 'Fraunces', serif;
      letter-spacing: -0.03em;
    }
  </style>
<style data-purpose="component-tags">
    .spec-label {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #7D7791;
    }
    .hatch-pattern {
      background: repeating-linear-gradient(
        -45deg,
        rgba(255, 255, 255, 0.04),
        rgba(255, 255, 255, 0.04) 6px,
        rgba(255, 255, 255, 0.1) 6px,
        rgba(255, 255, 255, 0.1) 12px
      );
    }
  </style>
</head>
<body class="bg-[#F8F7FC] text-brand-ink font-sans antialiased selection:bg-brand-lavender selection:text-brand-violet min-h-screen pb-24">
<!-- BEGIN: StickySystemHeader -->
<header class="sticky top-0 z-50 bg-[#F8F7FC]/90 backdrop-blur-md border-b border-brand-border/70 px-4 py-3.5">
<div class="max-w-md mx-auto flex items-center justify-between">
<div class="flex items-center space-x-2.5">
<div class="w-8 h-8 rounded-xl bg-brand-violet flex items-center justify-center text-white font-serif font-bold text-lg shadow-sm">
          L
        </div>
<div>
<div class="flex items-center space-x-1.5">
<span class="text-xs font-semibold uppercase tracking-wider text-brand-violet">LabPresensi UI</span>
<span class="bg-brand-lime text-brand-ink text-[10px] font-bold px-1.5 py-0.5 rounded-full">v1.2</span>
</div>
<p class="text-[11px] text-brand-ink-muted">Sistem Praktikum Universitas</p>
</div>
</div>
<div class="flex items-center space-x-2">
<span class="px-2.5 py-1 rounded-full text-xs font-medium bg-brand-lavender/60 text-brand-violet border border-brand-lavender">
          iOS Mobile 390px
        </span>
</div>
</div>
</header>
<!-- END: StickySystemHeader -->
<main class="max-w-md mx-auto px-4 pt-6 space-y-8">
<!-- BEGIN: SystemOverviewHero -->
<section class="space-y-3" data-purpose="design-system-intro">
<div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white border border-brand-border text-[11px] text-brand-ink-muted">
<span class="w-2 h-2 rounded-full bg-brand-violet animate-pulse"></span>
<span>01 — COMPONENT STICKER SHEET</span>
</div>
<h1 class="text-3xl sm:text-4xl leading-tight font-editorial font-normal text-brand-ink">
        Satu ritme praktikum, <br/>
<span class="font-editorial-italic font-normal text-brand-violet">di setiap sudut lab.</span>
</h1>
<p class="text-xs text-brand-ink-muted leading-relaxed">
        Sistem komponen terpadu untuk asisten laboratorium, dosen pembimbing, dan mahasiswa. Dibuat presisi mengadopsi struktur visual modular Sebenza.
      </p>
</section>
<!-- END: SystemOverviewHero -->
<!-- BEGIN: SectionTokens -->
<section class="bg-white rounded-3xl p-5 border border-brand-border shadow-card space-y-5" data-purpose="design-tokens">
<div class="flex items-center justify-between pb-3 border-b border-brand-border/60">
<div>
<span class="spec-label">Section 01</span>
<h2 class="text-lg font-bold text-brand-ink">Color &amp; Radii Tokens</h2>
</div>
<i class="ph ph-swatches text-brand-violet text-xl"></i>
</div>
<!-- Color Swatches Grid -->
<div class="space-y-2.5">
<span class="spec-label">Core Palette Swatches</span>
<div class="grid grid-cols-4 gap-2 text-center">
<!-- Primary Violet -->
<div class="group">
<div class="h-14 rounded-2xl bg-brand-violet flex items-end p-2 text-white text-[11px] font-bold shadow-sm">
              90%
            </div>
<p class="text-[11px] font-bold mt-1 text-brand-ink">Violet</p>
<p class="text-[9px] text-brand-ink-muted font-mono">#5B3BE8</p>
</div>
<!-- Lime Accent -->
<div class="group">
<div class="h-14 rounded-2xl bg-brand-lime flex items-end p-2 text-brand-ink text-[11px] font-bold shadow-sm">
              Active
            </div>
<p class="text-[11px] font-bold mt-1 text-brand-ink">Lime</p>
<p class="text-[9px] text-brand-ink-muted font-mono">#D3F36B</p>
</div>
<!-- Lavender Tint -->
<div class="group">
<div class="h-14 rounded-2xl bg-brand-lavender flex items-end p-2 text-brand-violet text-[11px] font-bold border border-brand-border/40">
              Soft
            </div>
<p class="text-[11px] font-bold mt-1 text-brand-ink">Lavender</p>
<p class="text-[9px] text-brand-ink-muted font-mono">#E4DBFF</p>
</div>
<!-- Coral Pink -->
<div class="group">
<div class="h-14 rounded-2xl bg-brand-pink flex items-end p-2 text-[#9A1B4F] text-[11px] font-bold">
              Late
            </div>
<p class="text-[11px] font-bold mt-1 text-brand-ink">Soft Pink</p>
<p class="text-[9px] text-brand-ink-muted font-mono">#FFC2D9</p>
</div>
</div>
<div class="grid grid-cols-4 gap-2 text-center pt-1">
<!-- Dark Ink -->
<div>
<div class="h-10 rounded-xl bg-brand-ink flex items-center justify-center text-white text-[10px] font-mono">
              #17141F
            </div>
<p class="text-[10px] font-semibold mt-1">Dark Ink</p>
</div>
<!-- Surface Gray -->
<div>
<div class="h-10 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-center text-brand-ink-muted text-[10px] font-mono">
              #F4F2F9
            </div>
<p class="text-[10px] font-semibold mt-1">Surface</p>
</div>
<!-- Semantic Success -->
<div>
<div class="h-10 rounded-xl bg-[#22C55E]/15 text-[#15803D] border border-[#22C55E]/30 flex items-center justify-center text-[10px] font-bold">
              Success
            </div>
<p class="text-[10px] font-semibold mt-1">Valid</p>
</div>
<!-- Semantic Error -->
<div>
<div class="h-10 rounded-xl bg-[#EF4444]/15 text-[#B91C1C] border border-[#EF4444]/30 flex items-center justify-center text-[10px] font-bold">
              Danger
            </div>
<p class="text-[10px] font-semibold mt-1">Error</p>
</div>
</div>
</div>
<!-- Typography Scale Preview -->
<div class="pt-3 border-t border-brand-border/60 space-y-2">
<span class="spec-label">Type Scale Preview</span>
<div class="p-3.5 bg-brand-surface rounded-2xl border border-brand-border space-y-2">
<div class="flex items-baseline justify-between">
<span class="text-[10px] font-mono text-brand-violet">Display Serif 28px</span>
<span class="text-xl font-editorial font-bold text-brand-ink">Modul 04 - Sensor IoT</span>
</div>
<div class="flex items-baseline justify-between border-t border-brand-border/40 pt-1.5">
<span class="text-[10px] font-mono text-brand-violet">Editorial Italic 18px</span>
<span class="text-base font-editorial-italic text-brand-violet">Verifikasi Kehadiran</span>
</div>
<div class="flex items-baseline justify-between border-t border-brand-border/40 pt-1.5">
<span class="text-[10px] font-mono text-brand-violet">UI Body / Medium 13px</span>
<span class="text-xs font-medium text-brand-ink">Laboratorium Komputasi C-302</span>
</div>
</div>
</div>
</section>
<!-- END: SectionTokens -->
<!-- BEGIN: SectionButtons -->
<section class="bg-white rounded-3xl p-5 border border-brand-border shadow-card space-y-4" data-purpose="button-components">
<div class="flex items-center justify-between pb-2 border-b border-brand-border/60">
<div>
<span class="spec-label">Section 02</span>
<h2 class="text-lg font-bold text-brand-ink">Buttons &amp; Action Controls</h2>
</div>
<span class="text-xs bg-brand-surface font-semibold px-2 py-0.5 rounded text-brand-ink-muted">7 States</span>
</div>
<!-- Primary Action: Violet Solid -->
<div class="space-y-1">
<div class="flex justify-between items-center text-[10px] text-brand-ink-muted font-medium">
<span>Component: Button / Primary</span>
<span class="font-mono">#5B3BE8</span>
</div>
<button class="w-full bg-brand-violet hover:bg-brand-violet-dark active:scale-[0.98] transition-all duration-150 text-white font-medium text-sm py-3.5 px-4 rounded-2xl flex items-center justify-center space-x-2 shadow-sm">
<span>Buka Presensi Praktikum</span>
<i class="ph ph-arrow-right text-base font-bold"></i>
</button>
</div>
<!-- Secondary Accent: High-Visibility Lime -->
<div class="space-y-1">
<div class="flex justify-between items-center text-[10px] text-brand-ink-muted font-medium">
<span>Component: Button / Accent Lime</span>
<span class="font-mono">#D3F36B</span>
</div>
<button class="w-full bg-brand-lime hover:bg-brand-lime-hover active:scale-[0.98] transition-all duration-150 text-brand-ink font-semibold text-sm py-3.5 px-4 rounded-2xl flex items-center justify-center space-x-2 shadow-sm">
<i class="ph ph-clock-clockwise text-lg"></i>
<span>Presensi Masuk (Tap PIN)</span>
</button>
</div>
<!-- Secondary Soft Lavender -->
<div class="space-y-1">
<div class="flex justify-between items-center text-[10px] text-brand-ink-muted font-medium">
<span>Component: Button / Soft Lavender</span>
<span class="font-mono">#E4DBFF</span>
</div>
<button class="w-full bg-brand-lavender/70 hover:bg-brand-lavender active:scale-[0.98] text-brand-violet font-semibold text-sm py-3.5 px-4 rounded-2xl flex items-center justify-center space-x-2">
<i class="ph ph-qr-code text-lg"></i>
<span>Tampilkan QR Dinamis Dosen</span>
</button>
</div>
<!-- Outline / Ghost & Destructive In Grid -->
<div class="grid grid-cols-2 gap-2.5 pt-1">
<button class="w-full bg-brand-surface hover:bg-zinc-100 text-brand-ink font-semibold text-xs py-3 px-3 rounded-xl border border-brand-border flex items-center justify-center space-x-1.5">
<i class="ph ph-download-simple text-sm"></i>
<span>Unduh Berita Acara</span>
</button>
<button class="w-full bg-[#FEE2E2]/60 hover:bg-[#FEE2E2] text-[#DC2626] font-semibold text-xs py-3 px-3 rounded-xl border border-[#FCA5A5]/40 flex items-center justify-center space-x-1.5">
<i class="ph ph-x-circle text-sm"></i>
<span>Batalkan Sesi</span>
</button>
</div>
<!-- Loading and Icon States -->
<div class="flex items-center justify-between pt-1 gap-2">
<button class="flex-1 bg-brand-violet/70 text-white text-xs font-medium py-2.5 px-3 rounded-xl flex items-center justify-center space-x-2 cursor-not-allowed" disabled="">
<svg class="animate-spin h-3.5 w-3.5 text-white" fill="none" viewbox="0 0 24 24">
<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
<path class="opacity-75" d="M4 12a8 8 0 018-8v8H4z" fill="currentColor"></path>
</svg>
<span>Sinkronisasi...</span>
</button>
<button class="w-10 h-10 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-center text-brand-ink hover:bg-zinc-100">
<i class="ph ph-sliders text-base"></i>
</button>
<button class="w-10 h-10 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-center text-brand-ink hover:bg-zinc-100">
<i class="ph ph-bell text-base"></i>
</button>
</div>
</section>
<!-- END: SectionButtons -->
<!-- BEGIN: SectionForms -->
<section class="bg-white rounded-3xl p-5 border border-brand-border shadow-card space-y-4" data-purpose="form-controls">
<div class="flex items-center justify-between pb-2 border-b border-brand-border/60">
<div>
<span class="spec-label">Section 03</span>
<h2 class="text-lg font-bold text-brand-ink">Form &amp; Filter Controls</h2>
</div>
<i class="ph ph-textbox text-brand-violet text-xl"></i>
</div>
<!-- Standard Focused Input (Sebenza Style Floating Pill) -->
<div class="space-y-1">
<label class="text-[11px] font-semibold text-brand-ink-muted">Input: Focused State</label>
<div class="relative bg-white rounded-2xl border-2 border-brand-violet p-3 pt-2 shadow-sm transition-all">
<span class="block text-[10px] uppercase font-bold text-brand-violet tracking-wider">Nomor Induk Mahasiswa (NIM)</span>
<div class="flex items-center justify-between">
<input class="w-full font-semibold text-brand-ink text-sm bg-transparent border-0 p-0 focus:ring-0 focus:outline-none" type="text" value="2205551042"/>
<i class="ph-fill ph-check-circle text-brand-violet text-base"></i>
</div>
</div>
</div>
<!-- Error State Input -->
<div class="space-y-1">
<label class="text-[11px] font-semibold text-brand-ink-muted">Input: Error State</label>
<div class="relative bg-white rounded-2xl border border-[#EF4444] p-3 pt-2 shadow-sm bg-red-50/20">
<span class="block text-[10px] uppercase font-bold text-[#DC2626] tracking-wider">Kode Akses Sesi Praktikum</span>
<div class="flex items-center justify-between">
<input class="w-full font-medium text-[#991B1B] text-sm bg-transparent border-0 p-0 focus:ring-0 focus:outline-none" type="text" value="LAB-992-ERR"/>
<i class="ph-fill ph-warning-circle text-[#EF4444] text-base"></i>
</div>
</div>
<p class="text-[10px] font-medium text-[#DC2626] pl-1">Kode sesi salah atau belum diaktifkan laboran.</p>
</div>
<!-- Search Field -->
<div class="space-y-1">
<label class="text-[11px] font-semibold text-brand-ink-muted">Search Bar</label>
<div class="flex items-center bg-brand-surface rounded-2xl px-3 py-2.5 border border-brand-border">
<i class="ph ph-magnifying-glass text-brand-ink-muted text-base mr-2"></i>
<input class="bg-transparent border-0 p-0 text-xs w-full focus:ring-0 text-brand-ink placeholder:text-brand-ink-muted/70" placeholder="Cari nama mahasiswa atau kelompok..." type="text"/>
<span class="text-[10px] bg-white border border-brand-border px-1.5 py-0.5 rounded text-brand-ink-muted font-mono">⌘K</span>
</div>
</div>
<!-- Dropdown Select -->
<div class="space-y-1">
<label class="text-[11px] font-semibold text-brand-ink-muted">Dropdown Selector</label>
<div class="flex items-center justify-between bg-white rounded-2xl px-3.5 py-3 border border-brand-border shadow-xs">
<div>
<p class="text-[10px] text-brand-ink-muted font-semibold uppercase">Modul Berjalan</p>
<p class="text-xs font-bold text-brand-ink">Modul 04 — Interfacing ADC &amp; DAC</p>
</div>
<i class="ph ph-caret-down text-brand-ink-muted text-sm"></i>
</div>
</div>
<!-- Segmented Toggle Control -->
<div class="space-y-1 pt-1">
<label class="text-[11px] font-semibold text-brand-ink-muted">Segmented Switch: Sesi Lab</label>
<div class="grid grid-cols-3 p-1 bg-brand-surface rounded-2xl border border-brand-border text-center text-xs font-semibold">
<div class="bg-brand-ink text-white py-2 rounded-xl shadow-xs">Pagi (08:00)</div>
<div class="text-brand-ink-muted py-2 hover:text-brand-ink">Siang (13:00)</div>
<div class="text-brand-ink-muted py-2 hover:text-brand-ink">Sore (16:00)</div>
</div>
</div>
</section>
<!-- END: SectionForms -->
<!-- BEGIN: SectionStatusChips -->
<section class="bg-white rounded-3xl p-5 border border-brand-border shadow-card space-y-4" data-purpose="status-chips">
<div class="flex items-center justify-between pb-2 border-b border-brand-border/60">
<div>
<span class="spec-label">Section 04</span>
<h2 class="text-lg font-bold text-brand-ink">Status Chips &amp; Badges</h2>
</div>
<i class="ph ph-tag text-brand-violet text-xl"></i>
</div>
<div class="flex flex-wrap gap-2">
<!-- Hadir / Clocked In (Lime) -->
<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-brand-lime text-brand-ink shadow-xs">
<span class="w-1.5 h-1.5 rounded-full bg-brand-ink"></span>
          Hadir Tepat Waktu
        </span>
<!-- Terlambat (Pink) -->
<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-brand-pink text-[#8A0F41]">
<span class="w-1.5 h-1.5 rounded-full bg-[#8A0F41]"></span>
          Terlambat 14m
        </span>
<!-- Izin Lab (Lavender) -->
<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-brand-lavender text-brand-violet">
          Izin Sakit
        </span>
<!-- Disetujui Dosen (Black pill) -->
<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-brand-ink text-white">
<i class="ph-fill ph-check text-xs text-brand-lime"></i>
          ACC Dosen
        </span>
<!-- Sesi Terbuka (Violet) -->
<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-brand-violet text-white">
<span class="w-1.5 h-1.5 rounded-full bg-brand-lime animate-pulse"></span>
          Sesi Aktif
        </span>
<!-- Alpa (Gray) -->
<span class="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-brand-surface border border-brand-border text-brand-ink-muted">
          Alpa (Tidak Hadir)
        </span>
<!-- Quota Badge -->
<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-zinc-100 text-zinc-700 font-mono">
          38/40 Kursi
        </span>
</div>
</section>
<!-- END: SectionStatusChips -->
<!-- BEGIN: SectionSessionCards -->
<section class="bg-white rounded-3xl p-5 border border-brand-border shadow-card space-y-4" data-purpose="shift-and-session-cards">
<div class="flex items-center justify-between pb-2 border-b border-brand-border/60">
<div>
<span class="spec-label">Section 05</span>
<h2 class="text-lg font-bold text-brand-ink">Schedule &amp; Shift Blocks</h2>
</div>
<span class="text-xs text-brand-violet font-semibold">Hero Card</span>
</div>
<!-- Weekday Strip Calendar (From Sebenza Staff App) -->
<div class="flex justify-between items-center bg-brand-surface p-1.5 rounded-2xl border border-brand-border text-center">
<div class="w-11 py-2 rounded-xl text-brand-ink-muted">
<span class="block text-[10px] uppercase font-bold">Sen</span>
<span class="text-xs font-bold">18</span>
</div>
<div class="w-11 py-2 rounded-xl text-brand-ink-muted">
<span class="block text-[10px] uppercase font-bold">Sel</span>
<span class="text-xs font-bold">19</span>
</div>
<!-- Active Selected Day -->
<div class="w-11 py-2 rounded-xl bg-brand-ink text-white shadow-xs">
<span class="block text-[10px] uppercase font-bold text-zinc-400">Rab</span>
<span class="text-xs font-extrabold text-brand-lime">20</span>
<span class="w-1 h-1 bg-brand-lime rounded-full mx-auto mt-0.5"></span>
</div>
<div class="w-11 py-2 rounded-xl text-brand-ink-muted">
<span class="block text-[10px] uppercase font-bold">Kam</span>
<span class="text-xs font-bold">21</span>
</div>
<div class="w-11 py-2 rounded-xl text-brand-ink-muted">
<span class="block text-[10px] uppercase font-bold">Jum</span>
<span class="text-xs font-bold">22</span>
</div>
</div>
<!-- High-Fidelity Practicum Shift Hero Card (Sebenza Style Deep Violet) -->
<div class="bg-brand-violet rounded-3xl p-5 text-white shadow-elevated relative overflow-hidden">
<div class="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-white/5 pointer-events-none blur-2xl"></div>
<div class="flex items-center justify-between mb-3">
<div class="flex items-center space-x-2">
<span class="px-2.5 py-1 rounded-full bg-white/15 text-[11px] font-semibold backdrop-blur-sm text-brand-lavender">
              Hari Ini · Sesi 01
            </span>
<span class="text-white/60 text-xs">Lab 3.2 Gedung B</span>
</div>
<span class="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold text-brand-lime">
            Wajib
          </span>
</div>
<!-- Editorial Time Display -->
<div class="my-2">
<h3 class="text-3xl font-editorial font-normal tracking-tight text-white">
            08:00 — 10:30
          </h3>
<p class="text-xs text-white/80 mt-0.5 font-medium">
            Praktikum Jaringan Komputer &amp; IoT
          </p>
</div>
<div class="mt-4 pt-3 border-t border-white/15 flex items-center justify-between">
<div class="flex items-center space-x-2.5">
<div class="w-8 h-8 rounded-full bg-brand-lime text-brand-ink flex items-center justify-center font-bold text-xs">
              PW
            </div>
<div>
<p class="text-xs font-semibold leading-tight text-white">Dr. Putu Wirawan</p>
<p class="text-[10px] text-white/70">Dosen Pembina Lab</p>
</div>
</div>
<button class="bg-brand-lime text-brand-ink hover:bg-brand-lime-hover px-3 py-2 rounded-xl font-bold text-xs flex items-center space-x-1.5 shadow-sm active:scale-95 transition-all">
<i class="ph ph-qr-code text-base"></i>
<span>Scan Masuk</span>
</button>
</div>
</div>
<!-- Secondary Role Cards Mini Grid (Sebenza Shift Block Showcase) -->
<div class="space-y-2 pt-1">
<span class="spec-label">Shift Blocks: Multi-Role Variants</span>
<!-- Shift 01: Kitchen/Lab Role (Lavender) -->
<div class="p-3.5 bg-brand-lavender/60 border border-brand-lavender rounded-2xl flex items-center justify-between">
<div>
<span class="text-xs font-bold text-brand-violet block">13:00 — 15:30 WIB</span>
<span class="text-[11px] text-brand-ink-muted">Lab Basis Data Terdistribusi · Kelas A</span>
</div>
<span class="text-[10px] font-bold bg-white text-brand-violet px-2.5 py-1 rounded-xl shadow-2xs">
            Asisten: 2 Mhs
          </span>
</div>
<!-- Shift 02: Bar/Pink Role (Pink) -->
<div class="p-3.5 bg-brand-pink/50 border border-brand-pink rounded-2xl flex items-center justify-between">
<div>
<span class="text-xs font-bold text-[#8A0F41] block">16:00 — 18:30 WIB</span>
<span class="text-[11px] text-brand-ink-muted">Praktikum Grafika Komputer · Lab Multimedia</span>
</div>
<span class="text-[10px] font-bold bg-[#8A0F41] text-white px-2.5 py-1 rounded-xl">
            Sesi Tambahan
          </span>
</div>
<!-- Shift 03: Dark Ink Shift Block (Open Shift / On Duty) -->
<div class="p-3.5 bg-brand-ink text-white rounded-2xl flex items-center justify-between">
<div>
<div class="flex items-center space-x-1.5">
<span class="text-xs font-bold text-brand-lime">19:00 — 21:00 WIB</span>
<span class="text-[9px] bg-white/20 text-white px-1.5 py-0.2 rounded">Bebas</span>
</div>
<span class="text-[11px] text-zinc-300">Open Lab &amp; Ujian Responsi Mandiri</span>
</div>
<button class="text-[10px] font-bold bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl border border-white/15">
            Daftar Kursi
          </button>
</div>
</div>
</section>
<!-- END: SectionSessionCards -->
<!-- BEGIN: SectionAttendanceComponents -->
<section class="bg-white rounded-3xl p-5 border border-brand-border shadow-card space-y-4" data-purpose="attendance-list-and-beacons">
<div class="flex items-center justify-between pb-2 border-b border-brand-border/60">
<div>
<span class="spec-label">Section 06</span>
<h2 class="text-lg font-bold text-brand-ink">Live Attendance &amp; Geo-Check</h2>
</div>
<i class="ph ph-map-pin text-brand-violet text-xl"></i>
</div>
<!-- Geo-Fence Beacon Indicator (From Clock In Map Reference) -->
<div class="p-4 bg-brand-surface rounded-2xl border border-brand-border flex items-center justify-between">
<div class="flex items-center space-x-3">
<div class="relative flex items-center justify-center">
<span class="w-8 h-8 rounded-full bg-brand-violet/20 animate-ping absolute"></span>
<div class="w-7 h-7 rounded-full bg-brand-violet text-white flex items-center justify-center z-10">
<i class="ph-fill ph-navigation-arrow text-xs"></i>
</div>
</div>
<div>
<p class="text-xs font-bold text-brand-ink">Laboratorium Rekayasa Perangkat Lunak</p>
<p class="text-[11px] text-brand-ink-muted">Akurasi GPS: <span class="font-semibold text-brand-ink">Dalam radius lab (6m)</span></p>
</div>
</div>
<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#DCFCE7] text-[#166534] border border-[#86EFAC]">
          ✓ On Site
        </span>
</div>
<!-- Attendance Row Items List -->
<div class="space-y-2">
<span class="spec-label">Student Roster Row Items</span>
<!-- Student Item 1: Hadir On-Time -->
<div class="p-3 bg-white rounded-2xl border border-brand-border hover:border-brand-violet transition-all flex items-center justify-between">
<div class="flex items-center space-x-3">
<div class="w-9 h-9 rounded-full bg-brand-violet/10 text-brand-violet flex items-center justify-center font-bold text-xs">
              NF
            </div>
<div>
<p class="text-xs font-bold text-brand-ink">Naufal Al-Farisi</p>
<p class="text-[10px] text-brand-ink-muted">NIM: 2205551020 · Sesi 08:02 WIB</p>
</div>
</div>
<div class="flex items-center space-x-2">
<span class="bg-brand-lime text-brand-ink text-[10px] font-bold px-2.5 py-1 rounded-full">
              Hadir
            </span>
<button class="text-brand-ink-muted hover:text-brand-ink">
<i class="ph ph-dots-three-vertical text-base"></i>
</button>
</div>
</div>
<!-- Student Item 2: Terlambat -->
<div class="p-3 bg-white rounded-2xl border border-brand-border flex items-center justify-between">
<div class="flex items-center space-x-3">
<div class="w-9 h-9 rounded-full bg-brand-pink/50 text-[#8A0F41] flex items-center justify-center font-bold text-xs">
              DM
            </div>
<div>
<p class="text-xs font-bold text-brand-ink">Dinda Maheswari</p>
<p class="text-[10px] text-brand-ink-muted">NIM: 2205551088 · Sesi 08:24 WIB</p>
</div>
</div>
<div class="flex items-center space-x-2">
<span class="bg-brand-pink text-[#8A0F41] text-[10px] font-bold px-2 py-1 rounded-full">
              +14 Menit
            </span>
<button class="text-brand-ink-muted hover:text-brand-ink">
<i class="ph ph-dots-three-vertical text-base"></i>
</button>
</div>
</div>
<!-- Student Item 3: Izin -->
<div class="p-3 bg-white rounded-2xl border border-brand-border flex items-center justify-between">
<div class="flex items-center space-x-3">
<div class="w-9 h-9 rounded-full bg-brand-lavender text-brand-violet flex items-center justify-center font-bold text-xs">
              IK
            </div>
<div>
<p class="text-xs font-bold text-brand-ink">I Ketut Sudarsana</p>
<p class="text-[10px] text-brand-ink-muted">NIM: 2205551012 · Surat Dokter</p>
</div>
</div>
<div class="flex items-center space-x-2">
<span class="bg-brand-lavender text-brand-violet text-[10px] font-bold px-2.5 py-1 rounded-full">
              Izin Lab
            </span>
<button class="text-brand-ink-muted hover:text-brand-ink">
<i class="ph ph-dots-three-vertical text-base"></i>
</button>
</div>
</div>
</div>
</section>
<!-- END: SectionAttendanceComponents -->
<!-- BEGIN: SectionMetricsAndStats -->
<section class="bg-white rounded-3xl p-5 border border-brand-border shadow-card space-y-4" data-purpose="metrics-summary">
<div class="flex items-center justify-between pb-2 border-b border-brand-border/60">
<div>
<span class="spec-label">Section 07</span>
<h2 class="text-lg font-bold text-brand-ink">Attendance Analytics &amp; Recap</h2>
</div>
<i class="ph ph-chart-bar text-brand-violet text-xl"></i>
</div>
<!-- Editorial Numbers Display Card (Sebenza Style Net Pay / Big Numeral) -->
<div class="bg-brand-ink rounded-3xl p-5 text-white shadow-elevated">
<div class="flex items-center justify-between text-zinc-400 text-xs pb-3 border-b border-white/10">
<span>Persentase Kehadiran Modul 04</span>
<span class="font-mono text-brand-lime">Semester Genap 2024</span>
</div>
<div class="my-4">
<div class="flex items-baseline space-x-1">
<span class="text-4xl sm:text-5xl font-editorial tracking-tight text-white font-normal">95.0</span>
<span class="text-2xl font-editorial font-bold text-brand-lime">%</span>
</div>
<p class="text-[11px] text-zinc-300 mt-1">38 dari 40 praktikan menyelesaikan modul tepat waktu.</p>
</div>
<div class="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center">
<div class="p-2 bg-white/5 rounded-xl">
<span class="block text-lg font-bold text-white">38</span>
<span class="text-[10px] text-zinc-400">Hadir Tepat</span>
</div>
<div class="p-2 bg-white/5 rounded-xl">
<span class="block text-lg font-bold text-brand-pink">02</span>
<span class="text-[10px] text-zinc-400">Terlambat</span>
</div>
<div class="p-2 bg-white/5 rounded-xl">
<span class="block text-lg font-bold text-brand-lavender">00</span>
<span class="text-[10px] text-zinc-400">Alpa / Bolos</span>
</div>
</div>
</div>
<!-- Weekly Hours / Attendance Bar Visualizer -->
<div class="p-4 bg-brand-surface rounded-2xl border border-brand-border space-y-3">
<div class="flex justify-between items-center text-xs">
<span class="font-bold text-brand-ink">Aktivitas Lab Mingguan</span>
<span class="text-[11px] font-semibold text-brand-violet">Target 100%</span>
</div>
<div class="flex items-end justify-between h-20 pt-2 px-2">
<!-- Mon -->
<div class="flex flex-col items-center gap-1.5">
<div class="w-6 bg-brand-lavender rounded-lg h-10"></div>
<span class="text-[9px] font-bold text-brand-ink-muted">Sen</span>
</div>
<!-- Tue -->
<div class="flex flex-col items-center gap-1.5">
<div class="w-6 bg-brand-lavender rounded-lg h-12"></div>
<span class="text-[9px] font-bold text-brand-ink-muted">Sel</span>
</div>
<!-- Wed (Peak Day) -->
<div class="flex flex-col items-center gap-1.5">
<div class="w-6 bg-brand-violet rounded-lg h-16 relative">
<span class="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-brand-violet">40</span>
</div>
<span class="text-[9px] font-bold text-brand-violet">Rab</span>
</div>
<!-- Thu -->
<div class="flex flex-col items-center gap-1.5">
<div class="w-6 bg-brand-lavender rounded-lg h-14"></div>
<span class="text-[9px] font-bold text-brand-ink-muted">Kam</span>
</div>
<!-- Fri -->
<div class="flex flex-col items-center gap-1.5">
<div class="w-6 bg-brand-lime rounded-lg h-8"></div>
<span class="text-[9px] font-bold text-brand-ink-muted">Jum</span>
</div>
</div>
</div>
</section>
<!-- END: SectionMetricsAndStats -->
<!-- BEGIN: SectionFeedbackAndDialogs -->
<section class="bg-white rounded-3xl p-5 border border-brand-border shadow-card space-y-4" data-purpose="system-feedback-modals">
<div class="flex items-center justify-between pb-2 border-b border-brand-border/60">
<div>
<span class="spec-label">Section 08</span>
<h2 class="text-lg font-bold text-brand-ink">Feedback &amp; Dialog States</h2>
</div>
<i class="ph ph-chat-circle-check text-brand-violet text-xl"></i>
</div>
<!-- Success Notification Toast -->
<div class="p-3.5 bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl flex items-center space-x-3">
<div class="w-8 h-8 rounded-full bg-[#22C55E] text-white flex items-center justify-center shrink-0">
<i class="ph-bold ph-check text-base"></i>
</div>
<div class="flex-1">
<p class="text-xs font-bold text-[#14532D]">Presensi Berhasil Diverifikasi!</p>
<p class="text-[10px] text-[#166534]">Log waktu 08:02:14 WIB tercatat di server fakultas.</p>
</div>
</div>
<!-- Overtime / Threshold Warning Card (Sebenza Style Flagged Box) -->
<div class="p-4 bg-brand-surface rounded-2xl border border-brand-border space-y-3">
<div class="flex items-start space-x-3">
<div class="w-8 h-8 rounded-full bg-brand-pink/50 text-[#8A0F41] flex items-center justify-center shrink-0 mt-0.5">
<i class="ph-bold ph-warning text-base"></i>
</div>
<div>
<h4 class="text-xs font-bold text-brand-ink">Batas Dispensasi Keterlambatan</h4>
<p class="text-[11px] text-brand-ink-muted mt-0.5 leading-relaxed">
              Mahasiswa yang hadir lewat dari pukul <strong>08:30 WIB</strong> wajib melapor ke laboran untuk izin manual atau dianggap alpa.
            </p>
</div>
</div>
<div class="flex justify-end space-x-2 pt-1">
<button class="px-3 py-1.5 rounded-xl bg-white border border-brand-border text-[11px] font-bold text-brand-ink">
            Tutup
          </button>
<button class="px-3 py-1.5 rounded-xl bg-brand-violet text-[11px] font-bold text-white shadow-xs">
            Lihat Regulasi
          </button>
</div>
</div>
<!-- Empty State Card -->
<div class="p-6 bg-brand-surface rounded-2xl border border-dashed border-brand-border text-center space-y-2">
<div class="w-12 h-12 bg-white rounded-2xl mx-auto flex items-center justify-center text-brand-violet shadow-2xs border border-brand-border">
<i class="ph ph-calendar-blank text-2xl"></i>
</div>
<p class="text-xs font-bold text-brand-ink">Tidak Ada Praktikum Aktif</p>
<p class="text-[11px] text-brand-ink-muted max-w-[220px] mx-auto">
          Semua sesi lab untuk hari ini telah selesai atau belum dipublikasi asisten.
        </p>
</div>
</section>
<!-- END: SectionFeedbackAndDialogs -->
<!-- BEGIN: SystemFooterSpecs -->
<footer class="pt-4 pb-8 text-center space-y-2" data-purpose="sticker-sheet-footer">
<div class="inline-flex items-center gap-1.5 text-[10px] uppercase font-bold text-brand-ink-muted tracking-widest bg-white px-3 py-1.5 rounded-full border border-brand-border">
<span>LabPresensi System</span>
<span class="w-1 h-1 rounded-full bg-brand-violet"></span>
<span>React Native Mobile Token Set</span>
</div>
<p class="text-[11px] text-brand-ink-muted">
        Dirancang dengan visual token Sebenza: Violet, Lime &amp; Editorial Serif.
      </p>
</footer>
<!-- END: SystemFooterSpecs -->
</main>
<!-- BEGIN: BottomNavigationPreview -->
<nav class="fixed bottom-0 left-0 right-0 z-40 bg-brand-ink border-t border-white/10 px-6 py-2.5 max-w-md mx-auto shadow-2xl rounded-t-3xl" data-purpose="mobile-dock">
<div class="flex items-center justify-between text-zinc-400">
<!-- Active Tab (Lime Icon) -->
<button class="flex flex-col items-center gap-0.5 text-brand-lime">
<i class="ph-fill ph-squares-four text-xl"></i>
<span class="text-[9px] font-semibold">Sticker</span>
</button>
<!-- Jadwal -->
<button class="flex flex-col items-center gap-0.5 hover:text-white transition-colors">
<i class="ph ph-calendar text-xl"></i>
<span class="text-[9px] font-medium">Jadwal</span>
</button>
<!-- Center Presensi Masuk FAB -->
<div class="-mt-5">
<button class="w-12 h-12 rounded-2xl bg-brand-lime text-brand-ink flex items-center justify-center shadow-lg active:scale-95 transition-transform border-4 border-brand-ink">
<i class="ph-bold ph-qr-code text-2xl"></i>
</button>
</div>
<!-- Presensi -->
<button class="flex flex-col items-center gap-0.5 hover:text-white transition-colors">
<i class="ph ph-fingerprint text-xl"></i>
<span class="text-[9px] font-medium">Presensi</span>
</button>
<!-- Profil -->
<button class="flex flex-col items-center gap-0.5 hover:text-white transition-colors">
<i class="ph ph-user text-xl"></i>
<span class="text-[9px] font-medium">Akun</span>
</button>
</div>
</nav>
<!-- END: BottomNavigationPreview -->
</body></html>