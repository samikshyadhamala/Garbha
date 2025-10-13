// Test pdf-parse/node specifically for Node.js environment
const fs = require('fs');
const path = require('path');
const { PDFParse, VerbosityLevel } = require('pdf-parse/node');  // ✅ Use /node version

const uploadsDir = path.join(__dirname, 'uploads', 'chat');
const files = fs.readdirSync(uploadsDir).filter(f => f.endsWith('.pdf'));

if (files.length === 0) {
  console.log('❌ No PDF files found');
  process.exit(1);
}

const pdfPath = path.join(uploadsDir, files[0]);
console.log('Testing with:', pdfPath);
console.log('File exists:', fs.existsSync(pdfPath));

async function testNodeVersion() {
  console.log('\n🧪 Testing pdf-parse/node with different load methods...\n');

  // Test 1: Load with path
  console.log('Test 1: Load with { url: path }');
  try {
    const parser = new PDFParse({ verbosity: VerbosityLevel.ERRORS });
    await parser.load({ url: pdfPath });
    const text = await parser.getText();
    const info = await parser.getInfo();
    console.log('✅ SUCCESS with path!');
    console.log('Pages:', info.numPages);
    console.log('Text preview:', text.substring(0, 200));
    await parser.destroy();
    return;
  } catch (err) {
    console.log('❌ Failed:', err.message);
  }

  // Test 2: Load with Buffer
  console.log('\nTest 2: Load with { data: Buffer }');
  try {
    const parser = new PDFParse({ verbosity: VerbosityLevel.ERRORS });
    const dataBuffer = fs.readFileSync(pdfPath);
    await parser.load({ data: dataBuffer });
    const text = await parser.getText();
    const info = await parser.getInfo();
    console.log('✅ SUCCESS with Buffer!');
    console.log('Pages:', info.numPages);
    console.log('Text preview:', text.substring(0, 200));
    await parser.destroy();
    return;
  } catch (err) {
    console.log('❌ Failed:', err.message);
  }

  // Test 3: Just pass the path directly
  console.log('\nTest 3: Load with path string directly');
  try {
    const parser = new PDFParse({ verbosity: VerbosityLevel.ERRORS });
    await parser.load(pdfPath);
    const text = await parser.getText();
    const info = await parser.getInfo();
    console.log('✅ SUCCESS with direct path!');
    console.log('Pages:', info.numPages);
    console.log('Text preview:', text.substring(0, 200));
    await parser.destroy();
    return;
  } catch (err) {
    console.log('❌ Failed:', err.message);
  }

  // Test 4: Check what methods are available
  console.log('\nTest 4: Inspecting PDFParse methods');
  const parser = new PDFParse({ verbosity: VerbosityLevel.ERRORS });
  console.log('Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(parser)));
  console.log('\nParser instance properties:', Object.keys(parser));
}

testNodeVersion().catch(console.error);