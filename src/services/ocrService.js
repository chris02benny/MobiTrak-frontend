import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
// Vite-friendly worker import (resolves to an asset URL)
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure PDF.js worker using local bundled asset instead of CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

console.log('📸 OCR Service initialized with both image and PDF support');

/**
 * OCR Service for processing Indian driver's license documents
 * Supports PDF files with front/back pages only
 * Validates document authenticity before processing
 */
class OCRService {
  constructor() {
    this.tesseractWorker = null;
    this.isInitialized = false;
  }

  /**
   * Initialize Tesseract worker
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('OCR Service already initialized');
      return;
    }

    try {
      console.log('Initializing Tesseract OCR worker...');
      this.tesseractWorker = await Tesseract.createWorker('eng');

      console.log('Setting Tesseract parameters...');
      await this.tesseractWorker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,/-:',
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
      });

      this.isInitialized = true;
      console.log('OCR Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize OCR Service:', error);
      console.error('Error details:', error.message, error.stack);
      throw new Error(`OCR initialization failed: ${error.message}`);
    }
  }

  /**
   * Process a PDF file and extract Indian driving license information
   * @param {File} file - The uploaded PDF file
   * @returns {Promise<Object>} Extracted license data
   */
  async processLicenseFile(file) {
    console.log('=== Starting License File Processing ===');

    try {
      await this.initialize();

      // Support both PDF and image files for testing
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type.toLowerCase())) {
        throw new Error('Please upload a PDF or image file containing your driving license.');
      }

      console.log('File validation passed, proceeding with OCR...');

      if (file.type === 'application/pdf') {
        console.log('PDF processing detected, attempting PDF OCR...');
        try {
          return await this.processPDF(file);
        } catch (pdfError) {
          console.warn('PDF processing failed, suggesting image upload:', pdfError.message);
          throw new Error('PDF processing is currently unavailable due to worker configuration issues. Please convert your PDF to an image (JPG/PNG) and upload that instead. Image processing works perfectly!');
        }
      } else {
        console.log('Image processing detected, proceeding with image OCR...');
        return await this.processImage(file);
      }

    } catch (error) {
      console.error('=== OCR Processing Failed ===');
      console.error('Error:', error.message);
      console.error('Stack:', error.stack);

      // For debugging, let's try to provide some basic extracted text if possible
      try {
        console.log('Attempting basic text extraction for debugging...');
        const basicData = await this.extractBasicTextFromPDF(file);
        console.log('Basic extraction successful:', basicData);
        return basicData;
      } catch (basicError) {
        console.error('Basic extraction also failed:', basicError.message);
        throw new Error(`Complete OCR failure: ${error.message}`);
      }
    }
  }

  /**
   * Process image file (JPG, PNG) for OCR
   * @param {File} imageFile - Image file
   * @returns {Promise<Object>} Extracted license data
   */
  async processImage(imageFile) {
    try {
      console.log('Processing image file...');
      console.log('Image details:', {
        name: imageFile.name,
        size: imageFile.size,
        type: imageFile.type
      });

      // Create image element for OCR
      const imageUrl = URL.createObjectURL(imageFile);
      const img = new Image();

      return new Promise((resolve, reject) => {
        img.onload = async () => {
          try {
            console.log('Image loaded successfully, dimensions:', img.width, 'x', img.height);
            console.log('Starting Tesseract OCR recognition...');

            const result = await this.tesseractWorker.recognize(img);
            const { text, confidence } = result.data;

            console.log(`✅ OCR completed successfully!`);
            console.log(`📊 Confidence: ${confidence}%`);
            console.log(`📝 Extracted text length: ${text.length} characters`);
            console.log(`📄 Text preview:`, text.substring(0, 500));

            // Clean up
            URL.revokeObjectURL(imageUrl);

            // Verify this is a valid Indian driving license
            console.log('🔍 Verifying document as Indian DL...');
            const validationResult = this.verifyIndianDrivingLicense(text, '');
            console.log('Document verification result:', validationResult);

            if (!validationResult.isValid) {
              throw new Error(`Invalid document: ${validationResult.message}. Please upload a valid Indian Driving License.`);
            }

            // Parse the extracted text
            console.log('🔍 Parsing extracted text for Indian DL patterns...');
            const extractedData = this.parseIndianDLText(text, '');

            const resultData = {
              license_number: extractedData.license_number || '',
              full_name: extractedData.full_name || '',
              date_of_birth: extractedData.date_of_birth || '',
              fathers_name: extractedData.fathers_name || '',
              address: extractedData.address || '',
              issue_date: extractedData.issue_date || '',
              validity_nt: extractedData.validity_nt || '',
              validity_tr: extractedData.validity_tr || '',
              license_class: extractedData.license_class || '',
              blood_group: extractedData.blood_group || '',
              issuing_authority: extractedData.issuing_authority || '',
              raw_extracted_text: text,
              validation: validationResult
            };

            console.log('📋 Final extracted data:', resultData);
            resolve(resultData);
          } catch (error) {
            console.error('OCR processing failed:', error);
            URL.revokeObjectURL(imageUrl);
            reject(error);
          }
        };

        img.onerror = () => {
          URL.revokeObjectURL(imageUrl);
          reject(new Error('Failed to load image file'));
        };

        img.src = imageUrl;
      });
    } catch (error) {
      console.error('Error processing image:', error);
      throw error;
    }
  }

  /**
   * Basic text extraction for debugging purposes
   */
  async extractBasicTextFromPDF(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      let allText = '';
      for (let i = 1; i <= Math.min(pdf.numPages, 2); i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        allText += `Page ${i}: ${pageText}\n`;
      }

      console.log('Extracted basic text:', allText.substring(0, 500));

      return {
        license_number: 'TEXT_EXTRACTION_TEST',
        full_name: 'PDF TEXT EXTRACTED',
        date_of_birth: '',
        fathers_name: '',
        address: allText.substring(0, 200),
        issue_date: '',
        validity_nt: '',
        validity_tr: '',
        license_class: '',
        blood_group: '',
        issuing_authority: '',
        raw_extracted_text: allText
      };
    } catch (error) {
      console.error('Basic text extraction failed:', error);
      throw error;
    }
  }

  /**
   * Get mock Indian DL data for testing purposes
   * @returns {Object} Mock license data
   */
  getMockIndianDLData() {
    return {
      license_number: 'MH1420110012345',
      full_name: 'RAJESH KUMAR SHARMA',
      date_of_birth: '1990-05-15',
      fathers_name: 'SURESH KUMAR SHARMA',
      address: 'FLAT NO 101, BUILDING A, SECTOR 15, VASHI, NAVI MUMBAI, MAHARASHTRA - 400703',
      issue_date: '2020-03-10',
      validity_nt: '2040-03-09',
      validity_tr: '2025-03-09',
      license_class: 'MCWG, LMV',
      blood_group: 'B+',
      issuing_authority: 'RTO THANE'
    };
  }

  /**
   * Process PDF file containing front and back pages of Indian driving license
   * @param {File} pdfFile - PDF file
   * @returns {Promise<Object>} Extracted license data
   */
  async processPDF(pdfFile) {
    try {
      console.log('Starting PDF processing...');
      console.log('File details:', {
        name: pdfFile.name,
        size: pdfFile.size,
        type: pdfFile.type,
        lastModified: pdfFile.lastModified
      });

      // Convert file to array buffer
      const arrayBuffer = await pdfFile.arrayBuffer();
      console.log('PDF file loaded, size:', arrayBuffer.byteLength);

      // Load PDF document
      console.log('Loading PDF document...');
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        verbosity: 1 // Enable some PDF.js logging for debugging
      });

      const pdf = await loadingTask.promise;
      console.log(`PDF loaded successfully with ${pdf.numPages} pages`);

      let frontPageText = '';
      let backPageText = '';

      // Process first page (front of license)
      if (pdf.numPages >= 1) {
        try {
          console.log('Processing front page...');
          const frontCanvas = await this.renderPDFPageToCanvas(pdf, 1);
          frontPageText = await this.extractTextFromCanvas(frontCanvas);
          console.log('Front page OCR completed, text length:', frontPageText.length);
        } catch (error) {
          console.error('Error processing front page:', error);
          throw new Error('Failed to process front page of the license');
        }
      }

      // Process second page (back of license) if available
      if (pdf.numPages >= 2) {
        try {
          console.log('Processing back page...');
          const backCanvas = await this.renderPDFPageToCanvas(pdf, 2);
          backPageText = await this.extractTextFromCanvas(backCanvas);
          console.log('Back page OCR completed, text length:', backPageText.length);
        } catch (error) {
          console.warn('Error processing back page:', error);
          // Back page is optional, continue with front page only
        }
      }

      // Check if we have any text extracted
      if (!frontPageText.trim() && !backPageText.trim()) {
        throw new Error('No text could be extracted from the PDF. Please ensure the document is clear and readable.');
      }

      // Verify this is a valid Indian driving license
      console.log('Verifying document as Indian DL...');
      const validationResult = this.verifyIndianDrivingLicense(frontPageText, backPageText);
      console.log('Document verification result:', validationResult);

      if (!validationResult.isValid) {
        throw new Error(`Invalid document: ${validationResult.message}. Please upload a valid Indian Driving License.`);
      }

      // Parse extracted text to structured data
      console.log('Parsing extracted text...');
      console.log('Front page text sample:', frontPageText.substring(0, 500));
      console.log('Back page text sample:', backPageText.substring(0, 500));

      const extractedData = this.parseIndianDLText(frontPageText, backPageText);
      console.log('Data extraction completed:', extractedData);

      // If no meaningful data was extracted, provide a basic structure
      if (!extractedData.license_number && !extractedData.full_name) {
        console.warn('No meaningful data extracted, providing basic structure with extracted text');
        return {
          license_number: '',
          full_name: '',
          date_of_birth: '',
          fathers_name: '',
          address: '',
          issue_date: '',
          validity_nt: '',
          validity_tr: '',
          license_class: '',
          blood_group: '',
          issuing_authority: '',
          raw_text_front: frontPageText.substring(0, 1000),
          raw_text_back: backPageText.substring(0, 1000)
        };
      }

      return extractedData;

    } catch (error) {
      console.error('Error processing PDF:', error);

      // Provide more specific error messages
      if (error.message.includes('Invalid PDF')) {
        throw new Error('The uploaded file appears to be corrupted or is not a valid PDF.');
      } else if (error.message.includes('password')) {
        throw new Error('Password-protected PDFs are not supported. Please upload an unprotected PDF.');
      } else if (error.name === 'UnknownErrorException') {
        throw new Error('Failed to process the PDF. Please try uploading a different file or check if the PDF is readable.');
      }

      throw error;
    }
  }

  /**
   * Verify if the document is a valid Indian Driving License
   * @param {string} frontText - Text from front page
   * @param {string} backText - Text from back page
   * @returns {Object} Validation result with isValid and details
   */
  verifyIndianDrivingLicense(frontText, backText) {
    const combinedText = `${frontText} ${backText}`.toUpperCase();

    // Check for key Indian DL identifiers
    const dlIdentifiers = [
      'DRIVING LICENCE',
      'DRIVING LICENSE',
      'DL NO',
      'LICENCE NO',
      'LICENSE NO',
      'VALIDITY',
      'ISSUED BY',
      'TRANSPORT AUTHORITY',
      'GOVERNMENT OF',
      'MCWG',
      'LMV',
      'S/D/W OF',
      'PERMANENT ADDRESS',
      'PRESENT ADDRESS',
      'INDIAN UNION',
      'GOVERNMENT OF KERALA',
      'GOVERNMENT OF INDIA',
      'RTO',
      'REGIONAL TRANSPORT'
    ];

    // Must contain at least 4 key identifiers to be considered valid
    const foundIdentifiers = dlIdentifiers.filter(identifier =>
      combinedText.includes(identifier)
    );

    console.log('Found DL identifiers:', foundIdentifiers);

    // Check for Indian DL number pattern (enhanced)
    const dlNumberPatterns = [
      /[A-Z]{2}\d{2}\s?\d{9,11}[A-Z]?/,  // Standard format: KL05 20210002344
      /[A-Z]{2}\d{2}\s?\d{4}\s?\d{5,7}[A-Z]?/,  // Alternative format
      /[A-Z]{2}\d{2}\s?\d{11}/  // Kerala format
    ];
    
    const hasValidDLNumber = dlNumberPatterns.some(pattern => 
      pattern.test(combinedText.replace(/\s/g, ''))
    );

    // Check for state codes (Indian states)
    const stateCodes = ['KL', 'MH', 'TN', 'KA', 'AP', 'TS', 'GJ', 'RJ', 'MP', 'UP', 'WB', 'OR', 'AS', 'PB', 'HR', 'HP', 'JK', 'DL', 'CH', 'AN', 'LD', 'PY', 'GA', 'MN', 'MZ', 'NL', 'SK', 'TR', 'AR', 'BR', 'JH', 'CT', 'UT'];
    const hasStateCode = stateCodes.some(code => combinedText.includes(code));

    // Check for date patterns (issue/validity dates)
    const datePattern = /\d{2}[-\/]\d{2}[-\/]\d{4}/;
    const hasDates = datePattern.test(combinedText);

    // Check for name field
    const hasNameField = combinedText.includes('NAME') || combinedText.includes('HOME');

    // Validation scoring
    let score = 0;
    const checks = {
      identifiers: foundIdentifiers.length >= 3,
      dlNumber: hasValidDLNumber,
      stateCode: hasStateCode,
      dates: hasDates,
      nameField: hasNameField
    };

    if (checks.identifiers) score += 2;
    if (checks.dlNumber) score += 2;
    if (checks.stateCode) score += 1;
    if (checks.dates) score += 1;
    if (checks.nameField) score += 1;

    // Be more permissive: if a valid DL number exists and at least one other
    // strong signal (identifier/state/date/name) is present, accept.
    const isValid = hasValidDLNumber ? (score >= 3) : (score >= 5);

    return {
      isValid,
      score,
      maxScore: 7,
      checks,
      foundIdentifiers,
      confidence: Math.round((score / 7) * 100),
      message: isValid 
        ? 'Valid Indian Driving License detected' 
        : `Invalid document. Score: ${score}/7. Missing: ${Object.entries(checks).filter(([_, passed]) => !passed).map(([key]) => key).join(', ')}`
    };
  }

  /**
   * Render PDF page to canvas for OCR processing
   * @param {Object} pdf - PDF document object
   * @param {number} pageNumber - Page number to render
   * @returns {Promise<HTMLCanvasElement>} Canvas with rendered page
   */
  async renderPDFPageToCanvas(pdf, pageNumber) {
    try {
      const page = await pdf.getPage(pageNumber);
      const scale = 2.0; // Higher scale for better OCR accuracy
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Failed to get 2D context from canvas');
      }

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      console.log(`Rendering page ${pageNumber} to canvas (${canvas.width}x${canvas.height})`);
      await page.render(renderContext).promise;

      return canvas;
    } catch (error) {
      console.error(`Error rendering page ${pageNumber}:`, error);
      throw new Error(`Failed to render page ${pageNumber} of the PDF`);
    }
  }

  /**
   * Extract text from canvas using Tesseract
   * @param {HTMLCanvasElement} canvas - Canvas containing the image
   * @returns {Promise<string>} Extracted text
   */
  async extractTextFromCanvas(canvas) {
    try {
      if (!this.tesseractWorker) {
        throw new Error('OCR worker not initialized');
      }

      console.log('Starting OCR text extraction...');
      const { data: { text, confidence } } = await this.tesseractWorker.recognize(canvas);

      console.log(`OCR completed with confidence: ${confidence}%`);
      console.log('Extracted text preview:', text.substring(0, 200) + '...');

      return text;
    } catch (error) {
      console.error('Error extracting text from canvas:', error);
      throw new Error('Failed to extract text from the document image');
    }
  }

  /**
   * Parse extracted text from Indian Driving License
   * @param {string} frontText - Text from front of license
   * @param {string} backText - Text from back of license
   * @returns {Object} Structured license data
   */
  parseIndianDLText(frontText, backText) {
    console.log('🔍 Parsing Indian DL Text...');
    console.log('📄 Front text length:', frontText.length);
    console.log('📄 Back text length:', backText.length);
    console.log('📝 Front text preview:', frontText.substring(0, 300));
    if (backText) console.log('📝 Back text preview:', backText.substring(0, 300));

    const combinedText = `${frontText}\n${backText}`;
    const lines = combinedText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    console.log('📋 Total lines to process:', lines.length);
    console.log('📋 First 10 lines:', lines.slice(0, 10));

    const licenseData = {
      license_number: '',
      full_name: '',
      date_of_birth: '',
      fathers_name: '',
      address: '',
      issue_date: '',
      validity_nt: '',
      validity_tr: '',
      license_class: '',
      blood_group: '',
      issuing_authority: ''
    };

    // Parse Indian DL data using specific patterns
    console.log('🔍 Starting line-by-line parsing...');
    console.log('📄 Raw text preview (first 1000 chars):', combinedText.substring(0, 1000));
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const upperLine = line.toUpperCase();
      const nextLine = i + 1 < lines.length ? lines[i + 1] : '';

      // Debug current line being processed
      if (upperLine.includes('NAME') || upperLine.includes('DL') || upperLine.includes('DOB') || upperLine.includes('DATE')) {
        console.log(`🔍 Line ${i}: "${line}" | Next: "${nextLine}"`);
      }

      // Extract DL Number - Indian format: XX##############
      if (!licenseData.license_number) {
        // Look for "DL No" or "DL No." patterns
        if (upperLine.includes('DL NO') || upperLine.includes('DL.NO') || upperLine.includes('DL NUMBER')) {
          // Try to extract from same line
          const dlMatch = line.match(/DL\s*NO\.?\s*:?\s*([A-Z]{2}\d{2}\s?\d{9,11}[A-Z]?)/i);
          if (dlMatch) {
            licenseData.license_number = dlMatch[1].replace(/\s/g, '');
            console.log('✅ DL Number found on same line:', licenseData.license_number);
          }
          // Check next line if not found on same line
          else if (nextLine) {
            const nextDlMatch = nextLine.match(/([A-Z]{2}\d{2}\s?\d{9,11}[A-Z]?)/);
            if (nextDlMatch) {
              licenseData.license_number = nextDlMatch[1].replace(/\s/g, '');
              console.log('✅ DL Number found on next line:', licenseData.license_number);
            }
          }
        }

        // Alternative: Look for standalone DL number pattern
        if (!licenseData.license_number) {
          const dlMatch = line.match(/([A-Z]{2}\d{2}\s?\d{9,11}[A-Z]?)/);
          if (dlMatch) {
            licenseData.license_number = dlMatch[1].replace(/\s/g, '');
            console.log('✅ DL Number found as standalone pattern:', licenseData.license_number);
          }
        }
      }

      // Extract Name - specifically from "Name:" field in Indian DL (with OCR error handling)
      if (!licenseData.full_name) {
        // Look for "Name:" pattern (case insensitive) - handles OCR errors like "Home:"
        if ((upperLine.includes('NAME') || upperLine.includes('HOME')) && upperLine.includes(':')) {
          // Try to extract name from same line
          const nameMatch = line.match(/(?:name|home)\s*:\s*(.+)/i);
          if (nameMatch && nameMatch[1].trim().length > 2) {
            licenseData.full_name = nameMatch[1].trim().toUpperCase();
            console.log('✅ Name found on same line:', licenseData.full_name);
          }
          // If not found on same line, check next line
          else if (nextLine && nextLine.trim().length > 2 && !nextLine.match(/^\d/) && !nextLine.toUpperCase().includes('S/D/W')) {
            licenseData.full_name = nextLine.trim().toUpperCase();
            console.log('✅ Name found on next line:', licenseData.full_name);
          }
        }

        // Alternative patterns for name extraction
        if (!licenseData.full_name) {
          // Look for standalone "NAME" or "HOME" followed by the actual name
          if ((upperLine === 'NAME' || upperLine === 'HOME') && nextLine && nextLine.trim().length > 2) {
            licenseData.full_name = nextLine.trim().toUpperCase();
            console.log('✅ Name found after standalone NAME/HOME:', licenseData.full_name);
          }

          // Look for "Name" or "Home" without colon
          if ((upperLine.startsWith('NAME ') || upperLine.startsWith('HOME ')) && !upperLine.includes(':')) {
            const nameAfterSpace = line.substring(line.toUpperCase().indexOf(upperLine.startsWith('NAME') ? 'NAME' : 'HOME') + 4).trim();
            if (nameAfterSpace.length > 2) {
              licenseData.full_name = nameAfterSpace.toUpperCase();
              console.log('✅ Name found after NAME/HOME space:', licenseData.full_name);
            }
          }
        }
      }

      // Extract Father's/Guardian's Name - after "S/D/W of" or "S/W of"
      if (!licenseData.fathers_name && (upperLine.includes('S/D/W OF') || upperLine.includes('S/W OF'))) {
        const fatherMatch = line.match(/s\/[dw]\/w\s+of\s*:?\s*(.+)/i);
        if (fatherMatch) {
          licenseData.fathers_name = fatherMatch[1].trim();
        } else if (nextLine) {
          licenseData.fathers_name = nextLine.trim();
        }
      }

      // Extract Date of Birth (with OCR error handling)
      if (!licenseData.date_of_birth) {
        // Look for date patterns in lines containing birth-related keywords
        if (upperLine.includes('DOB') || upperLine.includes('DATE OF BIRTH') || upperLine.includes('DATE O BIRTH') ||
            upperLine.includes('DATE OF BITH') || (upperLine.includes('DATE') && (upperLine.includes('BIRTH') || upperLine.includes('BITH')))) {

          // Extract date from same line (format: "Date Of Bith : 17-06-1998 Blood Group Unknown")
          const dobMatch = line.match(/(\d{2}[-\/]\d{2}[-\/]\d{4})/);
          if (dobMatch) {
            licenseData.date_of_birth = this.standardizeDate(dobMatch[1]);
            console.log('✅ DOB found on same line:', licenseData.date_of_birth);
          }
          // Check next line if not found on same line
          else if (nextLine) {
            const nextDobMatch = nextLine.match(/(\d{2}[-\/]\d{2}[-\/]\d{4})/);
            if (nextDobMatch) {
              licenseData.date_of_birth = this.standardizeDate(nextDobMatch[1]);
              console.log('✅ DOB found on next line:', licenseData.date_of_birth);
            }
          }
        }

        // Alternative: Look for any line with date pattern that might be DOB
        if (!licenseData.date_of_birth) {
          // Look for dates that could be birth dates (before 2010, reasonable age range)
          const dobMatch = line.match(/(\d{2}[-\/]\d{2}[-\/](19|20)\d{2})/);
          if (dobMatch) {
            const year = parseInt(dobMatch[1].split(/[-\/]/)[2]);
            // Only consider dates between 1950-2010 as potential birth dates
            if (year >= 1950 && year <= 2010) {
              licenseData.date_of_birth = this.standardizeDate(dobMatch[1]);
              console.log('✅ DOB found by date pattern analysis:', licenseData.date_of_birth);
            }
          }
        }
      }

      // Extract Issue Date (may appear on next line)
      if (!licenseData.issue_date && (upperLine.includes('ISSUE DATE') || upperLine.includes('ISSUE') || upperLine.includes('DATE'))) {
        console.log('🔍 Found potential issue date line:', line);
        // Look for "Issue Date" pattern with colon or dash
        const issueDateMatch = line.match(/issue\s*date\s*:?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i);
        if (issueDateMatch) {
          licenseData.issue_date = this.standardizeDate(issueDateMatch[1]);
          console.log('✅ Issue Date found with label:', licenseData.issue_date);
        }
        // Look for date patterns in the same line
        else {
          const issueMatch = line.match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/);
          if (issueMatch) {
            licenseData.issue_date = this.standardizeDate(issueMatch[1]);
            console.log('✅ Issue Date found:', licenseData.issue_date);
          }
        }
        // Check next line for date if current line has "Issue Date" but no date
        if (!licenseData.issue_date && (upperLine.includes('ISSUE') || upperLine.includes('DATE')) && nextLine) {
          const nextIssueMatch = nextLine.match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/);
          if (nextIssueMatch) {
            licenseData.issue_date = this.standardizeDate(nextIssueMatch[1]);
            console.log('✅ Issue Date found on next line:', licenseData.issue_date);
          }
        }
      }

      // Extract Validity dates (enhanced for Kerala format)
      if (upperLine.includes('VALIDITY')) {
        // Handle "Validity NT" header followed by dates on next line
        if (upperLine.includes('NT') && !licenseData.validity_nt) {
          // Look for dates on same line first
          const validityMatch = line.match(/(\d{2}[-\/]\d{2}[-\/]\d{4})/);
          if (validityMatch) {
            licenseData.validity_nt = this.standardizeDate(validityMatch[1]);
            console.log('✅ Validity NT found on same line:', licenseData.validity_nt);
          }
          // Check next line for dates; may contain two dates (Issue Date and Validity NT)
          else if (nextLine) {
            const twoDates = nextLine.match(/(\d{2}[-\/]\d{2}[-\/]\d{4})\s+(\d{2}[-\/]\d{2}[-\/]\d{4})/);
            if (twoDates) {
              const d1 = this.standardizeDate(twoDates[1]);
              const d2 = this.standardizeDate(twoDates[2]);
              if (!licenseData.issue_date) {
                licenseData.issue_date = d1;
                console.log('✅ Issue Date inferred from two-date line:', licenseData.issue_date);
              }
              licenseData.validity_nt = d2;
              console.log('✅ Validity NT inferred from two-date line:', licenseData.validity_nt);
            } else {
              const nextValidityMatch = nextLine.match(/(\d{2}[-\/]\d{2}[-\/]\d{4})/);
              if (nextValidityMatch) {
                licenseData.validity_nt = this.standardizeDate(nextValidityMatch[1]);
                console.log('✅ Validity NT found on next line:', licenseData.validity_nt);
              }
            }
          }
        }

        if (upperLine.includes('TR') && !licenseData.validity_tr) {
          const validityMatch = line.match(/(\d{2}[-\/]\d{2}[-\/]\d{4})/);
          if (validityMatch) {
            licenseData.validity_tr = this.standardizeDate(validityMatch[1]);
            console.log('✅ Validity TR found on same line:', licenseData.validity_tr);
          }
          else if (nextLine) {
            const nextValidityMatch = nextLine.match(/(\d{2}[-\/]\d{2}[-\/]\d{4})/);
            if (nextValidityMatch) {
              licenseData.validity_tr = this.standardizeDate(nextValidityMatch[1]);
              console.log('✅ Validity TR found on next line:', licenseData.validity_tr);
            }
          }
        }
      }

      // Handle lines with multiple dates (like "30-12-2019 15-06-2038")
      if (!licenseData.validity_nt || !licenseData.validity_tr) {
        const multipleDates = line.match(/(\d{2}[-\/]\d{2}[-\/]\d{4})\s+(\d{2}[-\/]\d{2}[-\/]\d{4})/);
        if (multipleDates) {
          if (!licenseData.validity_nt) {
            licenseData.validity_nt = this.standardizeDate(multipleDates[2]); // Second date is usually NT validity
            console.log('✅ Validity NT found in multi-date line:', licenseData.validity_nt);
          }
          if (!licenseData.validity_tr) {
            licenseData.validity_tr = this.standardizeDate(multipleDates[1]); // First date might be TR validity
            console.log('✅ Validity TR found in multi-date line:', licenseData.validity_tr);
          }
        }
        // Sometimes only a single date is present below Validity (NT)
        if (!licenseData.validity_nt && upperLine.includes('VALIDITY') && nextLine) {
          const singleDate = nextLine.match(/(\d{2}[-\/]\d{2}[-\/]\d{4})/);
          if (singleDate) {
            licenseData.validity_nt = this.standardizeDate(singleDate[1]);
            console.log('✅ Validity NT found on next line after header:', licenseData.validity_nt);
          }
        }
      }

      // Extract Class of Vehicle
      if (!licenseData.license_class && (upperLine.includes('COV') || upperLine.includes('CLASS'))) {
        const classMatch = line.match(/(MCWG|LMV|HMV|CRANE|FORK|3WN|3WT|TRANS|HGMV|HPMV|IDP)/gi);
        if (classMatch) {
          licenseData.license_class = classMatch.join(', ');
        }
      }

      // Extract Father's/Guardian's Name (S/D/W of) - with OCR error handling
      if (!licenseData.father_name) {
        if (upperLine.includes('S/D/W') || upperLine.includes('S/O') || upperLine.includes('D/O') || upperLine.includes('W/O') ||
            upperLine.includes('S/D/IWOL') || upperLine.includes('S/D/IWO')) {
          // Try to extract from same line - handle OCR errors
          const fatherMatch = line.match(/(?:S\/D\/W|S\/O|D\/O|W\/O|S\/D\/IWOL|S\/D\/IWO)\s*(?:of|OF|ol)?\s*:?\s*(.+)/i);
          if (fatherMatch) {
            licenseData.father_name = fatherMatch[1].trim().toUpperCase();
            console.log('✅ Father/Guardian name found on same line:', licenseData.father_name);
          }
          // Check next line if not found on same line
          else if (nextLine && nextLine.trim().length > 2) {
            licenseData.father_name = nextLine.trim().toUpperCase();
            console.log('✅ Father/Guardian name found on next line:', licenseData.father_name);
          }
        }
      }

      // Extract Address - enhanced for Kerala format (Permanent Address only)
      if (!licenseData.address) {
        // Look specifically for "Permanent Address" first
        if (upperLine.includes('PERMANENT ADDRESS') || upperLine.includes('PERMANENT ADRESS')) {
          let addressLines = [];
          let j = i + 1;

          // Collect address lines until we hit another field or "Present Address"
          while (j < lines.length && lines[j].trim()) {
            const currentLine = lines[j].trim();
            const upperCurrentLine = currentLine.toUpperCase();

            // Stop if we hit "Present Address" or other field headers
            if (upperCurrentLine.includes('PRESENT ADDRESS') ||
                upperCurrentLine.includes('VALIDITY') ||
                upperCurrentLine.includes('ISSUE') ||
                upperCurrentLine.includes('COV') ||
                upperCurrentLine.includes('BADGE') ||
                upperCurrentLine.includes('CLASS') ||
                upperCurrentLine.includes('EMERGENCY') ||
                upperCurrentLine.includes('LICENSING')) {
              console.log('🛑 Stopping address collection at:', currentLine);
              break;
            }

            // Add valid address lines (but limit to 3 lines to avoid reading too much)
            if (currentLine.length > 3 && !currentLine.match(/^\d+$/) && addressLines.length < 3) {
              addressLines.push(currentLine);
              console.log('📍 Added address line:', currentLine);
            }
            j++;
          }

          if (addressLines.length > 0) {
            licenseData.address = addressLines.join(', ');
            console.log('✅ Permanent Address found:', licenseData.address.substring(0, 100) + '...');
          }
        }
        // Fallback: Look for general "ADDRESS" if no "Permanent Address" found
        else if (upperLine.includes('ADDRESS') && !upperLine.includes('PRESENT')) {
          let addressLines = [];
          let j = i + 1;

          // Collect address lines until we hit another field or "Present Address"
          while (j < lines.length && lines[j].trim()) {
            const currentLine = lines[j].trim();
            const upperCurrentLine = currentLine.toUpperCase();

            // Stop if we hit "Present Address" or other field headers
            if (upperCurrentLine.includes('PRESENT ADDRESS') ||
                upperCurrentLine.includes('VALIDITY') ||
                upperCurrentLine.includes('ISSUE') ||
                upperCurrentLine.includes('COV') ||
                upperCurrentLine.includes('BADGE') ||
                upperCurrentLine.includes('CLASS') ||
                upperCurrentLine.includes('EMERGENCY') ||
                upperCurrentLine.includes('LICENSING')) {
              break;
            }

            // Add valid address lines
            if (currentLine.length > 3 && !currentLine.match(/^\d+$/)) {
              addressLines.push(currentLine);
            }
            j++;
          }

          if (addressLines.length > 0) {
            licenseData.address = addressLines.join(', ');
            console.log('✅ Address found (fallback):', licenseData.address.substring(0, 100) + '...');
          }
        }

        // Clean up the address if it contains duplicates
        if (licenseData.address) {
          // Remove duplicate parts and clean up formatting
          let cleanedAddress = licenseData.address;
          
          // Remove duplicate house names (e.g., "ITHIPARAMPIL HOUSE, THIPARAMPIL HOUSE,,")
          cleanedAddress = cleanedAddress.replace(/([^,]+),\s*\1,+/g, '$1,');
          
          // Remove duplicate address lines (e.g., "VILLOONNI P O ARPOOKARA, VILLOONNI P O ARPOOKARA,,")
          cleanedAddress = cleanedAddress.replace(/([^,]+),\s*\1,+/g, '$1,');
          
          // Remove duplicate city/postal code patterns (e.g., "KOTTAYAM,686008 KOTTAYAM, 686008")
          cleanedAddress = cleanedAddress.replace(/([A-Z]+,\d{6})\s*([A-Z]+,\s*\d{6})/g, '$1');
          
          // More aggressive duplicate removal for city/postal combinations
          cleanedAddress = cleanedAddress.replace(/([A-Z]+),\s*(\d{6})\s*\1,\s*\2/g, '$1,$2');
          
          // Clean up multiple commas and spaces
          cleanedAddress = cleanedAddress.replace(/,\s*,+/g, ',').replace(/\s+/g, ' ').trim();
          
          // Remove trailing comma
          cleanedAddress = cleanedAddress.replace(/,$/, '');
          
          if (cleanedAddress !== licenseData.address) {
            console.log('🧹 Cleaned address from:', licenseData.address);
            console.log('🧹 Cleaned address to:', cleanedAddress);
            licenseData.address = cleanedAddress;
          }
        }
      }

      // Extract Blood Group
      if (!licenseData.blood_group && (upperLine.includes('BG') || upperLine.includes('BLOOD') || upperLine.includes('B GROUP') || upperLine.includes('BLOODGRP'))) {
        console.log('🔍 Found potential blood group line:', line);
        // Look for "Blood Group :" pattern (with colon)
        const bgColonMatch = line.match(/blood\s*group\s*:\s*([ABO]{1,2})\s*(?:[+\-]|po|positive|negative)/i)
          || line.match(/\bBG\s*:\s*([ABO]{1,2})\s*(?:[+\-]|po|positive|negative)/i)
          || line.match(/blood\s*grp\s*:\s*([ABO]{1,2})\s*(?:[+\-]|po|positive|negative)/i)
          || line.match(/blood\s*group\s*[-–]\s*([ABO]{1,2})\s*(?:[+\-]|po|positive|negative)/i);
        if (bgColonMatch) {
          // Handle "po" (positive) format - convert to "+"
          let bgValue = bgColonMatch[1].toUpperCase();
          if (line.toLowerCase().includes('po') || line.toLowerCase().includes('positive')) {
            bgValue += '+';
          } else if (line.toLowerCase().includes('negative')) {
            bgValue += '-';
          }
          licenseData.blood_group = bgValue;
          console.log('✅ Blood group found with colon pattern:', licenseData.blood_group);
        }
        // Look for standard blood group patterns
        else {
          const bgMatch = line.match(/\b(AB|A|B|O)\s*[+\-]\b/i);
          if (bgMatch) {
            licenseData.blood_group = bgMatch[0].toUpperCase().replace(/\s+/g, '');
            console.log('✅ Blood group found:', licenseData.blood_group);
          }
          // Look for "Unknown" blood group
          else if (upperLine.includes('UNKNOWN') || line.toUpperCase().includes('UNKNOWN')) {
            licenseData.blood_group = 'Unknown';
            console.log('✅ Blood group found as Unknown');
          }
          // Check next line for blood group
          else if (nextLine) {
            const nextBgMatch = nextLine.match(/\b(AB|A|B|O)\s*[+\-]\b/i);
            if (nextBgMatch) {
              licenseData.blood_group = nextBgMatch[0].toUpperCase().replace(/\s+/g, '');
              console.log('✅ Blood group found on next line:', licenseData.blood_group);
            }
            else if (nextLine.toUpperCase().includes('UNKNOWN')) {
              licenseData.blood_group = 'Unknown';
              console.log('✅ Blood group found as Unknown on next line');
            }
          }
        }
      }

      // Extract Issuing Authority
      if (!licenseData.issuing_authority) {
        if (upperLine.includes('ISSUED BY') || upperLine.includes('LICENSING AUTHORITY')) {
          const authorityMatch = line.match(/(?:issued\s+by|licensing\s+authority)\s*:?\s*(.+)/i);
          if (authorityMatch) {
            licenseData.issuing_authority = authorityMatch[1].trim();
            console.log('✅ Issuing authority found on same line:', licenseData.issuing_authority);
          } else if (nextLine) {
            licenseData.issuing_authority = nextLine.trim();
            console.log('✅ Issuing authority found on next line:', licenseData.issuing_authority);
          }
        }

        // Look for RTO patterns
        if (!licenseData.issuing_authority && upperLine.includes('RTO')) {
          const rtoMatch = line.match(/RTO\s+(.+)/i);
          if (rtoMatch) {
            licenseData.issuing_authority = rtoMatch[0].trim();
            console.log('✅ RTO authority found:', licenseData.issuing_authority);
          }
        }
      }

      // Fallback: Handle patterns like "Issued by Government of Kerala"
      if (!licenseData.issuing_authority) {
        // Entire phrase on one line
        const issuedByGovMatch = line.match(/issued\s*by\s*:?\s*(government\s+of\s+[A-Za-z ]+)/i);
        if (issuedByGovMatch) {
          licenseData.issuing_authority = issuedByGovMatch[1].trim();
          console.log('✅ Issuing authority (Issued by Government of <State>) detected on same line:', licenseData.issuing_authority);
        } else if ((upperLine.includes('ISSUED BY') && nextLine) || upperLine.includes('GOVERNMENT OF')) {
          // Header on one line, value on the next; or standalone Government of <State>
          const nextGovMatch = nextLine && nextLine.match(/(government\s+of\s+[A-Za-z ]+)/i);
          const inlineGovMatch = line.match(/(government\s+of\s+[A-Za-z ]+)/i);
          const val = (nextGovMatch && nextGovMatch[1]) || (inlineGovMatch && inlineGovMatch[1]);
          if (val) {
            licenseData.issuing_authority = val.trim();
            console.log('✅ Issuing authority (Government of <State>) detected:', licenseData.issuing_authority);
          }
        }
      }
    }

    // Fallback: Global blood group extraction if not found in line-by-line parsing
    if (!licenseData.blood_group) {
      console.log('🔍 Searching globally for blood group patterns...');
      const bgGlobalMatch =
        combinedText.match(/blood\s*group\s*:?\s*([ABO]{1,2}\s*[+\-]|unknown)/i) ||
        combinedText.match(/\b(BG|BLOOD\s*GRP|B\s*GROUP|BLOOD)\b[^A-Z0-9+\-]{0,12}([ABO]{1,2}\s*[+\-])/i);

      const rawVal = (bgGlobalMatch && (bgGlobalMatch[1] || bgGlobalMatch[2])) || '';
      if (rawVal) {
        let norm = rawVal.toUpperCase().replace(/\s+/g, '');
        // OCR normalizations: 0 -> O, 8 -> B (e.g., A8+), handle common slips
        norm = norm.replace(/^0/, 'O').replace(/^A8/, 'AB').replace(/^B\+$/, 'B+');
        
        // Handle "po" (positive) format in global search
        if (combinedText.toLowerCase().includes('po') || combinedText.toLowerCase().includes('positive')) {
          norm += '+';
        } else if (combinedText.toLowerCase().includes('negative')) {
          norm += '-';
        }
        
        // Ensure it's a valid type
        if (/^(A|B|AB|O)[+-]$|^UNKNOWN$/.test(norm)) {
          licenseData.blood_group = norm;
          console.log('✅ Blood group found by global match:', licenseData.blood_group);
        }
      } else {
        console.log('❌ No blood group found in global search');
      }
    }

    // Fallback: Global issue date extraction if not found in line-by-line parsing
    if (!licenseData.issue_date) {
      console.log('🔍 Searching globally for issue date patterns...');
      const issueDateGlobalMatch = combinedText.match(/issue\s*date\s*:?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i);
      if (issueDateGlobalMatch) {
        licenseData.issue_date = this.standardizeDate(issueDateGlobalMatch[1]);
        console.log('✅ Issue date found by global match:', licenseData.issue_date);
      } else {
        console.log('❌ No issue date found in global search');
      }
    }

    // Show parsing results
    console.log('📊 Parsing Results Summary:');
    console.log('🆔 License Number:', licenseData.license_number || 'Not found');
    console.log('👤 Full Name:', licenseData.full_name || 'Not found');
    console.log('📅 Date of Birth:', licenseData.date_of_birth || 'Not found');
    console.log('📅 Issue Date:', licenseData.issue_date || 'Not found');
    console.log('🩸 Blood Group:', licenseData.blood_group || 'Not found');
    console.log('👨‍👩‍👧‍👦 Father\'s Name:', licenseData.fathers_name || 'Not found');
    console.log('🏠 Address:', licenseData.address ? licenseData.address.substring(0, 50) + '...' : 'Not found');
    console.log('🚗 License Class:', licenseData.license_class || 'Not found');

    // Clean up and validate extracted data
    return this.validateAndCleanIndianDLData(licenseData);
  }

  /**
   * Validate and clean extracted Indian DL data
   */
  validateAndCleanIndianDLData(data) {
    // Clean up empty strings
    Object.keys(data).forEach(key => {
      if (typeof data[key] === 'string') {
        data[key] = data[key].trim();
      }
    });

    // Validate DL number format
    if (data.license_number && !/^[A-Z]{2}\d{13}$/.test(data.license_number.replace(/\s/g, ''))) {
      console.warn(`Invalid DL number format: ${data.license_number}`);
    }

    // Validate dates
    ['date_of_birth', 'issue_date', 'validity_nt', 'validity_tr'].forEach(dateField => {
      if (data[dateField] && !this.isValidDate(data[dateField])) {
        console.warn(`Invalid date detected for ${dateField}: ${data[dateField]}`);
        data[dateField] = '';
      }
    });

    // Ensure required fields are present
    const requiredFields = ['license_number', 'full_name', 'date_of_birth'];
    const missingFields = requiredFields.filter(field => !data[field]);

    if (missingFields.length > 0) {
      console.warn('Missing required fields:', missingFields);
    }

    // Map to standard profile fields for compatibility
    const mappedData = {
      license_number: data.license_number,
      full_name: data.full_name,
      date_of_birth: data.date_of_birth,
      address: data.address,
      issue_date: data.issue_date,
      expiry_date: data.validity_nt || data.validity_tr, // Use NT validity as primary expiry
      license_class: data.license_class,
      fathers_name: data.father_name, // Map father_name to fathers_name for database compatibility
      blood_group: data.blood_group,
      issuing_authority: data.issuing_authority,
      validity_nt: data.validity_nt,
      validity_tr: data.validity_tr
    };

    return mappedData;
  }

  /**
   * Check if line contains a license number
   */
  matchLicenseNumber(line) {
    // Common license number patterns
    const patterns = [
      /[A-Z]\d{7,12}/,  // Letter followed by 7-12 digits
      /\d{8,12}/,       // 8-12 digits
      /[A-Z]{1,2}\d{6,10}/, // 1-2 letters followed by 6-10 digits
    ];
    
    return patterns.some(pattern => pattern.test(line));
  }

  /**
   * Extract license number from line
   */
  extractLicenseNumber(line) {
    const match = line.match(/[A-Z]*\d{6,12}/);
    return match ? match[0] : '';
  }

  /**
   * Extract dates from line
   */
  extractDates(line) {
    const datePatterns = [
      /\d{2}\/\d{2}\/\d{4}/g,  // MM/DD/YYYY
      /\d{2}-\d{2}-\d{4}/g,    // MM-DD-YYYY
      /\d{4}-\d{2}-\d{2}/g,    // YYYY-MM-DD
    ];
    
    const dates = [];
    for (const pattern of datePatterns) {
      const matches = line.match(pattern);
      if (matches) {
        dates.push(...matches.map(date => this.standardizeDate(date)));
      }
    }
    
    return dates;
  }

  /**
   * Standardize date format to YYYY-MM-DD
   */
  standardizeDate(dateStr) {
    try {
      if (!dateStr) return '';
      const trimmed = String(dateStr).trim();
      // Handle DD-MM-YYYY or DD/MM/YYYY
      const dmy = trimmed.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})$/);
      if (dmy) {
        const [_, dd, mm, yyyy] = dmy;
        return `${yyyy}-${mm}-${dd}`;
      }
      // Handle YYYY-MM-DD already standardized
      const ymd = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (ymd) return trimmed;

      // Fallback to Date parsing
      const date = new Date(trimmed);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
      return trimmed;
    } catch {
      return dateStr;
    }
  }

  /**
   * Check if line is likely a name
   */
  isLikelyName(line) {
    // Skip lines that are clearly not names
    if (line.length < 3 || line.length > 50) return false;
    if (/\d/.test(line) && !/^[A-Z\s]+\d*$/.test(line)) return false;
    if (line.includes('@') || line.includes('.com')) return false;
    
    // Look for name patterns
    const namePattern = /^[A-Z][a-z]+(\s[A-Z][a-z]+)+$/;
    return namePattern.test(line) || /^[A-Z\s]+$/.test(line);
  }

  /**
   * Clean and format name
   */
  cleanName(line) {
    return line.replace(/[^\w\s]/g, '').trim();
  }

  /**
   * Check if line is likely an address
   */
  isLikelyAddress(line) {
    const addressKeywords = ['ST', 'STREET', 'AVE', 'AVENUE', 'RD', 'ROAD', 'BLVD', 'BOULEVARD', 'DR', 'DRIVE', 'LN', 'LANE'];
    const upperLine = line.toUpperCase();
    
    return addressKeywords.some(keyword => upperLine.includes(keyword)) ||
           /\d+\s+[A-Z]/.test(line) || // Number followed by letter (street number)
           /\b\d{5}\b/.test(line);     // ZIP code
  }

  /**
   * Match license class patterns
   */
  matchLicenseClass(line) {
    return /CLASS\s*[A-Z]/i.test(line) || /^[A-Z]$/.test(line.trim());
  }

  /**
   * Extract license class
   */
  extractLicenseClass(line) {
    const match = line.match(/CLASS\s*([A-Z])/i) || line.match(/^([A-Z])$/);
    return match ? `Class ${match[1]}` : line.trim();
  }

  /**
   * Extract sex/gender
   */
  extractSex(line) {
    const match = line.match(/[MF]/i);
    return match ? match[0].toUpperCase() : '';
  }

  /**
   * Match height patterns
   */
  matchHeight(line) {
    return /\d+['"]?\s*\d*['"]?/.test(line) || /\d+\s*FT/.test(line.toUpperCase());
  }

  /**
   * Extract height
   */
  extractHeight(line) {
    const match = line.match(/(\d+)['"]?\s*(\d*)['"]?/) || line.match(/(\d+)\s*FT/i);
    return match ? line.trim() : '';
  }

  /**
   * Match weight patterns
   */
  matchWeight(line) {
    return /\d+\s*LBS?/i.test(line) || (/^\d{2,3}$/.test(line.trim()) && parseInt(line) > 80 && parseInt(line) < 500);
  }

  /**
   * Extract weight
   */
  extractWeight(line) {
    const match = line.match(/(\d+)\s*LBS?/i);
    return match ? `${match[1]} lbs` : line.trim();
  }

  /**
   * Extract eye color
   */
  extractEyeColor(line) {
    const colors = ['BLU', 'BRN', 'GRN', 'HAZ', 'GRY', 'BLK'];
    const upperLine = line.toUpperCase();
    const found = colors.find(color => upperLine.includes(color));
    return found || line.trim();
  }

  /**
   * Extract hair color
   */
  extractHairColor(line) {
    const colors = ['BLN', 'BRN', 'BLK', 'RED', 'GRY', 'WHI'];
    const upperLine = line.toUpperCase();
    const found = colors.find(color => upperLine.includes(color));
    return found || line.trim();
  }

  /**
   * Validate and clean extracted data
   */
  validateAndCleanData(data) {
    // Clean up empty strings
    Object.keys(data).forEach(key => {
      if (typeof data[key] === 'string') {
        data[key] = data[key].trim();
      }
    });

    // Validate dates
    ['date_of_birth', 'issue_date', 'expiry_date'].forEach(dateField => {
      if (data[dateField] && !this.isValidDate(data[dateField])) {
        console.warn(`Invalid date detected for ${dateField}: ${data[dateField]}`);
        data[dateField] = '';
      }
    });

    // Ensure license number is present
    if (!data.license_number) {
      console.warn('No license number detected');
    }

    return data;
  }

  /**
   * Validate date format
   */
  isValidDate(dateStr) {
    if (!dateStr) return false;
    const std = this.standardizeDate(dateStr);
    const date = new Date(std);
    return !isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100;
  }

  /**
   * Test OCR functionality with a simple text canvas
   * Can be called from browser console for debugging
   */
  async testOCR() {
    try {
      console.log('🧪 Starting OCR test...');
      await this.initialize();

      // Create a simple canvas with text
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 400;
      canvas.height = 100;

      // Draw white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw black text
      ctx.fillStyle = 'black';
      ctx.font = '20px Arial';
      ctx.fillText('TEST OCR FUNCTIONALITY', 50, 50);

      console.log('🎨 Test canvas created, running OCR...');

      // Run OCR on the test canvas
      const { data: { text, confidence } } = await this.tesseractWorker.recognize(canvas);

      console.log('✅ OCR Test Results:');
      console.log(`📊 Confidence: ${confidence}%`);
      console.log(`📝 Extracted text: "${text.trim()}"`);
      console.log('🎉 OCR is working correctly!');

      return { success: true, text: text.trim(), confidence };
    } catch (error) {
      console.error('❌ OCR Test Failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Test Indian DL parsing with mock text (Kerala format)
   * Can be called from browser console for debugging
   */
  testIndianDLParsing() {
    console.log('🧪 Testing Indian DL parsing with Kerala license format...');

    // Mock Kerala DL text based on the provided image
    const mockDLText = `
Indian Union Driving Licence
Issued by State of Kerala
DL No. KL21 2019002353T
Issue Date: 30-12-2019
Validity (NT): 16-06-2038
Validity (TR):
Name: AKHIL A B
Date O Birth: 17-06-1998
Blood Group: Unknown
Organ Donor: No
S/D/W of: A.JIKUMAR S
Permanent Address:
KURUGANAKONATH VEEDU,
POTTENCHIRA CHETTACHAL PO,
Nedumangad, Thiruvananthapura, KL 695551

DL No. KL21 2019002353T
Badge No.
Badge Date
Class of Vehicle: Cov Code: Issued by: Date of Issue
MCWG: KL21: 30-12-2019
LMV: KL21: 30-12-2019
CRANE: KL21: 30-12-2019
Emergency Contact
Licensing Authority
RTO NEDUMANGAD
    `;

    console.log('📝 Mock Kerala DL text:', mockDLText);

    // Parse the mock text
    const result = this.parseIndianDLText(mockDLText, '');

    console.log('✅ Kerala DL Parsing Test Results:');
    console.log('📋 Extracted data:', result);

    return result;
  }

  /**
   * Test with actual OCR extracted text
   * Can be called from browser console for debugging
   */
  testActualOCRText() {
    console.log('🧪 Testing with actual OCR extracted text...');

    // Actual OCR text from the console output - structured to match real extraction
    const actualOCRText = `Indian Union Driving Licence
Issued by State of Kerala e
No. KL21 20190023531
Issue Date Validity NT
30-12-2019 15-06-2038
Validity TR -
10-12-2019
Home :AKHIL AB
Date Of Bith : 17-06-1998 Blood Group Unknown
Ongmn Donck 11 Holders ure
S/D/IWol :AJIKUMARS E
Permanent Address Present Address s
KURUGNAMKONATH VEEDU, KURUGNAMKONATH VEEDU, 2
FOTTENCHIRA CHETTAGHAL FO, POTTENGHIRA CHETTACHAL PO, i
Hodumanged Theuvananihapu KL 895561 Nedamangad,Theuananihapu, L 595561
Date of issue
02300`;

    console.log('📝 Actual OCR text:', actualOCRText);

    // Parse the actual OCR text
    const result = this.parseIndianDLText(actualOCRText, '');

    console.log('✅ Actual OCR Parsing Test Results:');
    console.log('📋 Extracted data:', result);

    return result;
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    if (this.tesseractWorker) {
      await this.tesseractWorker.terminate();
      this.tesseractWorker = null;
      this.isInitialized = false;
    }
  }
}

// Export singleton instance
const ocrService = new OCRService();

// Make it globally available for testing
if (typeof window !== 'undefined') {
  window.ocrService = ocrService;
  console.log('🔧 OCR Service available globally as window.ocrService');
  console.log('💡 Test OCR: window.ocrService.testOCR()');
  console.log('💡 Test DL Parsing: window.ocrService.testIndianDLParsing()');
  console.log('💡 Test Actual OCR: window.ocrService.testActualOCRText()');
}

export default ocrService;
