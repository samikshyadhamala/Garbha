const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse'); // ✅ just the function
const Tesseract = require('tesseract.js');
const sharp = require('sharp');

/**
 * Extract text from PDF file
 */
async function extractTextFromPDF(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer); // ✅ call the function

    return {
      success: true,
      text: data.text,
      pages: data.numpages,
      info: data.info
    };
  } catch (error) {
    console.error('PDF extraction error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Extract text from image using OCR (Tesseract)
 */
async function extractTextFromImage(filePath) {
  try {
    const { data: { text } } = await Tesseract.recognize(
      filePath,
      'eng',
      { logger: info => console.log(info) } // Optional
    );

    return {
      success: true,
      text: text.trim()
    };
  } catch (error) {
    console.error('OCR error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Process image for vision
 */
async function processImageForVision(filePath) {
  try {
    const metadata = await sharp(filePath).metadata();

    let processedPath = filePath;
    if (metadata.width > 2048 || metadata.height > 2048) {
      processedPath = filePath.replace(/(\.\w+)$/, '_resized$1');
      await sharp(filePath)
        .resize(2048, 2048, { fit: 'inside' })
        .toFile(processedPath);
    }

    const imageBuffer = fs.readFileSync(processedPath);
    const base64Image = imageBuffer.toString('base64');

    return {
      success: true,
      base64: base64Image,
      metadata: {
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
        size: metadata.size
      }
    };
  } catch (error) {
    console.error('Image processing error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Main file processor
 */
async function processFile(filePath, mimeType) {
  const ext = path.extname(filePath).toLowerCase();

  // PDF files
  if (mimeType === 'application/pdf' || ext === '.pdf') {
    console.log('📄 Processing PDF:', filePath);
    return await extractTextFromPDF(filePath);
  }

  // Image files
  if (mimeType?.startsWith('image/') || ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'].includes(ext)) {
    console.log('🖼️  Processing Image:', filePath);

    const ocrResult = await extractTextFromImage(filePath);
    const visionResult = await processImageForVision(filePath);

    return {
      success: true,
      ocr: ocrResult,
      vision: visionResult
    };
  }

  // TXT files
  if (ext === '.txt') {
    try {
      const text = fs.readFileSync(filePath, 'utf8');
      return { success: true, text };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // DOC/DOCX unsupported
  if (['.doc', '.docx'].includes(ext)) {
    return { success: false, error: 'Document type not yet supported' };
  }

  return { success: false, error: 'Unsupported file type' };
}

/**
 * Process multiple attachments
 */
async function processAttachments(attachments) {
  const results = [];

  for (const attachment of attachments) {
    const result = await processFile(attachment.path || attachment.url, attachment.mimeType);
    results.push({
      fileName: attachment.fileName,
      type: attachment.type,
      ...result
    });
  }

  return results;
}

module.exports = {
  extractTextFromPDF,
  extractTextFromImage,
  processImageForVision,
  processFile,
  processAttachments
};
