import { supabase } from './supabaseClient';

export const BUG_REPORT_SCREENSHOT_BUCKET = 'bug-report-screenshots';
const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024;
const ALLOWED_SCREENSHOT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function getFileExtension(asset = {}) {
  const fromName = asset.fileName?.split('.').pop();
  const fromUri = asset.uri?.split('?')[0]?.split('.').pop();
  const extension = (fromName || fromUri || 'jpg').toLowerCase();

  if (extension === 'jpeg') {
    return 'jpg';
  }

  if (['jpg', 'png', 'webp'].includes(extension)) {
    return extension;
  }

  return 'jpg';
}

function getMimeType(asset = {}) {
  if (asset.mimeType && ALLOWED_SCREENSHOT_TYPES.has(asset.mimeType)) {
    return asset.mimeType;
  }

  const extension = getFileExtension(asset);
  if (extension === 'png') {
    return 'image/png';
  }
  if (extension === 'webp') {
    return 'image/webp';
  }
  return 'image/jpeg';
}

async function uploadScreenshot(asset) {
  if (!asset?.uri) {
    return null;
  }

  if (asset.fileSize && asset.fileSize > MAX_SCREENSHOT_BYTES) {
    throw new Error('De afbeelding is te groot. Kies een screenshot kleiner dan 5 MB.');
  }

  const mimeType = getMimeType(asset);
  const extension = getFileExtension(asset);
  const response = await fetch(asset.uri);
  const fileBuffer = await response.arrayBuffer();

  if (fileBuffer.byteLength > MAX_SCREENSHOT_BYTES) {
    throw new Error('De afbeelding is te groot. Kies een screenshot kleiner dan 5 MB.');
  }

  const randomPart = Math.random().toString(36).slice(2, 10);
  const path = `reports/${Date.now()}-${randomPart}.${extension}`;
  const { data, error } = await supabase.storage
    .from(BUG_REPORT_SCREENSHOT_BUCKET)
    .upload(path, fileBuffer, {
      contentType: mimeType,
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw error;
  }

  return {
    path: data.path,
    mimeType,
    size: fileBuffer.byteLength,
  };
}

export async function submitBugReportToSupabase({
  location,
  summary,
  steps,
  severity,
  context,
  screenshot,
}) {
  const uploadedScreenshot = screenshot ? await uploadScreenshot(screenshot) : null;

  const { error } = await supabase
    .from('bug_reports')
    .insert({
      location,
      summary,
      steps,
      severity,
      context,
      app_version: context?.appVersion ?? null,
      screenshot_path: uploadedScreenshot?.path ?? null,
      screenshot_mime_type: uploadedScreenshot?.mimeType ?? null,
      screenshot_size: uploadedScreenshot?.size ?? null,
    });

  if (error) {
    throw error;
  }

  return { ok: true };
}
