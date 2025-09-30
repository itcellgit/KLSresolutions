const fs = require("fs");
const path = require("path");
const pdf = require("pdf-parse");

async function testPdfParsing() {
  try {
    // Get the first PDF file from uploads directory
    const uploadsDir = path.join(__dirname, "uploads");
    const files = fs.readdirSync(uploadsDir);
    const pdfFiles = files.filter((file) =>
      file.toLowerCase().endsWith(".pdf")
    );

    if (pdfFiles.length === 0) {
      console.log("No PDF files found in uploads directory");
      return;
    }

    const testFile = pdfFiles[0];
    console.log(`Testing PDF parsing with file: ${testFile}`);

    const pdfPath = path.join(uploadsDir, testFile);
    const dataBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdf(dataBuffer);

    console.log(`PDF parsed successfully!`);
    console.log(`Pages: ${pdfData.numpages}`);
    console.log(`Text length: ${pdfData.text.length} characters`);
    console.log(`First 200 characters:`);
    console.log(pdfData.text.substring(0, 200));

    // Test search
    const searchTerm = "meeting";
    const found = pdfData.text.toLowerCase().includes(searchTerm.toLowerCase());
    console.log(
      `\nSearch test for "${searchTerm}": ${found ? "FOUND" : "NOT FOUND"}`
    );
  } catch (error) {
    console.error("Error testing PDF parsing:", error);
  }
}

testPdfParsing();
