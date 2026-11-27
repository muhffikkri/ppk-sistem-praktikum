import * as DocumentPicker from 'expo-document-picker';
import { File as ExpoFile, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

const csvMime = 'text/csv';

export async function chooseCsv(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: '*/*',
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset.name.toLowerCase().endsWith('.csv')) {
    throw new Error('Pilih berkas dengan ekstensi .csv.');
  }
  if (asset.size !== undefined && asset.size > 512 * 1024) {
    throw new Error('Ukuran berkas CSV maksimal 512 KB.');
  }
  if (Platform.OS === 'web') {
    if (asset.file) return asset.file.text();
    return (await fetch(asset.uri)).text();
  }
  return new ExpoFile(asset.uri).text();
}

export async function saveCsv(name: string, contents: string) {
  if (Platform.OS === 'web') {
    const link = document.createElement('a');
    const url = URL.createObjectURL(new Blob([contents], { type: csvMime }));
    link.download = name;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Menu berbagi berkas tidak tersedia pada perangkat ini.');
  }
  const file = new ExpoFile(Paths.cache, name);
  if (!file.exists) file.create();
  await file.write(contents);
  await Sharing.shareAsync(file.uri, { mimeType: csvMime });
}
