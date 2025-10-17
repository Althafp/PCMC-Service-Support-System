import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// PDF Color Scheme
const PdfColors = {
  blue800: [30, 64, 175],
  blue200: [191, 219, 254],
  blue50: [239, 246, 255],
  blue: [59, 130, 246],
  green: [34, 197, 94],
  green200: [187, 247, 208],
  green50: [240, 253, 244],
  orange: [249, 115, 22],
  orange200: [254, 215, 170],
  orange50: [255, 247, 237],
  grey: [107, 114, 128],
  grey300: [209, 213, 219],
  grey200: [229, 231, 235],
  grey100: [243, 244, 246],
  black: [0, 0, 0],
  white: [255, 255, 255]
};

export const generateReportPDF = async (report: any, projectLogo?: string) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  let yPos = 15; // Start position with margin
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;

  // ========== PAGE 1 ==========

  // HEADER SECTION
  doc.setFillColor(...PdfColors.blue50);
  doc.rect(margin, yPos, contentWidth, 15, 'F');
  doc.setDrawColor(...PdfColors.blue200);
  doc.rect(margin, yPos, contentWidth, 15, 'S');
  
  // Add logo if available
  let textStartX = margin + 3;
  if (projectLogo) {
    try {
      // Add logo (small, 12x12mm = ~45x45px)
      doc.addImage(projectLogo, 'PNG', margin + 2, yPos + 1.5, 12, 12);
      textStartX = margin + 16; // Shift text to right of logo
    } catch (error) {
      console.error('Error adding logo to PDF:', error);
      // Continue without logo
    }
  }
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PdfColors.black);
  doc.text('PCMC Service Report', textStartX, yPos + 5);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Report #${report.complaint_no}`, textStartX, yPos + 10);
  
  doc.text(`Date: ${report.date || 'N/A'}`, pageWidth - margin - 3, yPos + 5, { align: 'right' });
  doc.text(`Status: ${report.approval_status === 'approve' ? 'Approved' : report.approval_status === 'reject' ? 'Rejected' : 'Pending'}`, pageWidth - margin - 3, yPos + 10, { align: 'right' });
  
  yPos += 20;

  // BASIC INFORMATION & LOCATION DETAILS (2 columns)
  const col1X = margin;
  const col2X = margin + contentWidth / 2 + 5;
  const colWidth = contentWidth / 2 - 5;
  
  // Section headers
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PdfColors.blue800);
  doc.text('BASIC INFORMATION', col1X, yPos);
  doc.text('LOCATION DETAILS', col2X, yPos);
  yPos += 5;

  const addInfoRow = (label: string, value: string, x: number, y: number) => {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PdfColors.black);
    doc.text(`${label}:`, x, y);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const valueX = x + 35; // Fixed label width
    doc.text(value || 'N/A', valueX, y);
  };

  // Basic Info Column
  let tempY = yPos;
  addInfoRow('Complaint Type', report.complaint_type || '', col1X, tempY);
  tempY += 5;
  addInfoRow('System Type', report.system_type || '', col1X, tempY);
  tempY += 5;
  addInfoRow('Project Phase', report.project_phase || '', col1X, tempY);
  tempY += 5;
  addInfoRow('RFP Number', report.rfp_no || '', col1X, tempY);

  // Location Details Column
  tempY = yPos;
  addInfoRow('Zone', report.zone || '', col2X, tempY);
  tempY += 5;
  addInfoRow('Location', report.location || '', col2X, tempY);
  tempY += 5;
  addInfoRow('Ward', report.ward_no || '', col2X, tempY);
  tempY += 5;
  addInfoRow('Pole ID', report.pole_id || '', col2X, tempY);

  yPos += 25;

  // COORDINATES ROW
  doc.setFillColor(...PdfColors.grey100);
  doc.rect(margin, yPos, contentWidth, 8, 'F');
  doc.setDrawColor(...PdfColors.grey300);
  doc.rect(margin, yPos, contentWidth, 8, 'S');
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PdfColors.black);
  doc.text(`Location Coords: ${report.location_latitude || 'N/A'}, ${report.location_longitude || 'N/A'}`, margin + 2, yPos + 5);
  doc.text(`GPS: ${report.latitude || 'N/A'}, ${report.longitude || 'N/A'}`, col2X, yPos + 5);

  yPos += 12;

  // EQUIPMENT CHECKLIST TABLE
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PdfColors.blue800);
  doc.text('EQUIPMENT CHECKLIST', margin, yPos);
  yPos += 5;

  // Prepare table data
  const tableData: any[] = [];
  
  if (report.checklist_data) {
    const sections = Object.keys(report.checklist_data);
    const remarks = report.equipment_remarks || {};

    sections.forEach((section) => {
      const items = report.checklist_data[section];
      Object.keys(items).forEach((item) => {
        const status = items[item];
        const remarkKey = `${section}-${item}`;
        const valueKey = `${section}-${item}-value`;
        const remark = remarks[remarkKey];
        const value = remarks[valueKey];
        
        let remarksValue = '';
        if (value) remarksValue += `Val: ${value}`;
        if (remark) remarksValue += (remarksValue ? '\n' : '') + `Rem: ${remark}`;

        // Shorten section name
        const shortSection = section.replace('Junction Box', 'JBox')
          .replace('Raw Power Supply', 'Power')
          .replace('UPS System', 'UPS')
          .replace('Network Switch', 'Switch');

        tableData.push([
          shortSection,
          item.substring(0, 25), // Truncate long names
          status.toUpperCase(),
          remarksValue || ''
        ]);
      });
    });
  }

  // Draw table
  autoTable(doc, {
    startY: yPos,
    head: [['Section', 'Item', 'Status', 'Remarks/Value']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 7,
      cellPadding: 1.5,
      lineColor: PdfColors.grey300,
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: PdfColors.grey200,
      textColor: PdfColors.black,
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left'
    },
    columnStyles: {
      0: { cellWidth: contentWidth * 0.15 },
      1: { cellWidth: contentWidth * 0.35 },
      2: { cellWidth: contentWidth * 0.15, halign: 'center' },
      3: { cellWidth: contentWidth * 0.35, fontSize: 6 }
    },
    didParseCell: (data) => {
      // Color status column
      if (data.column.index === 2 && data.section === 'body') {
        const status = data.cell.raw?.toString().toLowerCase();
        if (status === 'ok') {
          data.cell.styles.textColor = PdfColors.green;
          data.cell.styles.fontStyle = 'bold';
        } else if (status === 'issue') {
          data.cell.styles.textColor = PdfColors.orange;
          data.cell.styles.fontStyle = 'bold';
        }
      }
      // Color remarks column
      if (data.column.index === 3 && data.section === 'body') {
        const text = data.cell.raw?.toString() || '';
        if (text.includes('Rem:')) {
          data.cell.styles.textColor = PdfColors.orange;
          data.cell.styles.fontStyle = 'italic';
        } else if (text.includes('Val:')) {
          data.cell.styles.textColor = PdfColors.blue;
        }
      }
    },
    margin: { left: margin, right: margin }
  });

  yPos = (doc as any).lastAutoTable.finalY + 6;

  // CAMERA & TEMPERATURE INFO BOXES
  const boxHeight = 12;
  
  // Camera Box (Blue)
  doc.setFillColor(...PdfColors.blue50);
  doc.rect(margin, yPos, colWidth, boxHeight, 'F');
  doc.setDrawColor(...PdfColors.blue200);
  doc.rect(margin, yPos, colWidth, boxHeight, 'S');
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PdfColors.black);
  doc.text(`Cameras: ${report.equipment_remarks?.camera_count || 'N/A'}`, margin + 2, yPos + 5);
  doc.setFontSize(7);
  doc.text(`Note: ${report.equipment_remarks?.camera_remarks || 'N/A'}`, margin + 2, yPos + 9);

  // Temperature Box (Orange)
  doc.setFillColor(...PdfColors.orange50);
  doc.rect(col2X, yPos, colWidth, boxHeight, 'F');
  doc.setDrawColor(...PdfColors.orange200);
  doc.rect(col2X, yPos, colWidth, boxHeight, 'S');
  
  doc.setFontSize(8);
  doc.text(`JB Temp: ${report.jb_temperature || 'N/A'}°C`, col2X + 2, yPos + 5);
  doc.text(`Thermistor: ${report.thermistor_temperature || 'N/A'}°C`, col2X + 2, yPos + 9);

  yPos += 18; // Add spacing after camera/temp boxes

  // Check if we need a new page for images section (need ~60mm minimum for header + first row)
  if (yPos > pageHeight - 65) {
    doc.addPage();
    yPos = margin;
  }

  // IMAGES SECTION
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PdfColors.blue800);
  doc.text('IMAGES', margin, yPos);
  yPos += 6;

  // Helper function to add image
  const addImage = async (url: string | undefined, label: string, x: number, y: number, width: number, height: number) => {
    if (!url) return;

    try {
      // Add label
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...PdfColors.black);
      doc.text(label, x + width / 2, y, { align: 'center' });
      
      // Add image border
      doc.setDrawColor(...PdfColors.grey300);
      doc.rect(x, y + 2, width, height, 'S');
      
      // Add image
      doc.addImage(url, 'JPEG', x, y + 2, width, height, undefined, 'FAST');
    } catch (error) {
      console.error('Error adding image to PDF:', error);
      // Draw placeholder
      doc.setFillColor(...PdfColors.grey100);
      doc.rect(x, y + 2, width, height, 'F');
      doc.setFontSize(6);
      doc.text('Image unavailable', x + width / 2, y + height / 2, { align: 'center' });
    }
  };

  // Before & After Images (140px height = ~50mm)
  const imageHeight = 50;
  const imageWidth = colWidth;
  
  await addImage(report.before_image_url, 'Before', col1X, yPos, imageWidth, imageHeight);
  await addImage(report.after_image_url, 'After', col2X, yPos, imageWidth, imageHeight);
  yPos += imageHeight + 8;

  // UPS & Thermistor Images (80px = ~28mm)
  const smallImageHeight = 28;
  const smallImageWidth = (contentWidth - 10) / 3;
  
  await addImage(report.ups_input_image_url, 'UPS Input', margin, yPos, smallImageWidth, smallImageHeight);
  await addImage(report.ups_output_image_url, 'UPS Output', margin + smallImageWidth + 5, yPos, smallImageWidth, smallImageHeight);
  await addImage(report.thermistor_image_url, 'Thermistor', margin + (smallImageWidth + 5) * 2, yPos, smallImageWidth, smallImageHeight);
  yPos += smallImageHeight + 6;

  // Raw Power Supply Images
  if (report.raw_power_supply_images && report.raw_power_supply_images.length > 0) {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('Raw Power Supply', margin, yPos);
    yPos += 4;
    
    const rawImageWidth = 35; // ~100px width
    const rawImageHeight = 28; // 80px
    let xPos = margin;
    let rowCount = 0;
    
    for (let i = 0; i < Math.min(report.raw_power_supply_images.length, 10); i++) {
      if (rowCount >= 5) {
        xPos = margin;
        yPos += rawImageHeight + 3;
        rowCount = 0;
      }
      
      await addImage(report.raw_power_supply_images[i], `Raw ${i + 1}`, xPos, yPos, rawImageWidth - 2, rawImageHeight);
      xPos += rawImageWidth;
      rowCount++;
    }
    
    yPos += rawImageHeight + 8;
  }

  // Check if we need a new page
  if (yPos > pageHeight - 80) {
    doc.addPage();
    yPos = margin;
  }

  // REMARKS & FEEDBACK SECTION
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PdfColors.blue800);
  doc.text('REMARKS & FEEDBACK', margin, yPos);
  yPos += 5;

  doc.setDrawColor(...PdfColors.grey300);
  doc.rect(margin, yPos, contentWidth, 30, 'S');
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PdfColors.black);
  
  let remarkY = yPos + 5;
  if (report.nature_of_complaint) {
    const lines = doc.splitTextToSize(`Complaint: ${report.nature_of_complaint}`, contentWidth - 4);
    doc.text(lines, margin + 2, remarkY);
    remarkY += lines.length * 4;
  }
  if (report.field_team_remarks) {
    const lines = doc.splitTextToSize(`Team Remarks: ${report.field_team_remarks}`, contentWidth - 4);
    doc.text(lines, margin + 2, remarkY);
    remarkY += lines.length * 4;
  }
  if (report.customer_feedback) {
    const lines = doc.splitTextToSize(`Customer Feedback: ${report.customer_feedback}`, contentWidth - 4);
    doc.text(lines, margin + 2, remarkY);
  }

  yPos += 35;

  // SIGNATURES SECTION
  if (yPos > pageHeight - 50) {
    doc.addPage();
    yPos = margin;
  }

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PdfColors.blue800);
  doc.text('SIGNATURES', margin, yPos);
  yPos += 5;

  const sigBoxWidth = colWidth;
  const sigBoxHeight = 40;

  // Technician Signature Box (Blue)
  doc.setFillColor(...PdfColors.blue50);
  doc.rect(col1X, yPos, sigBoxWidth, sigBoxHeight, 'F');
  doc.setDrawColor(...PdfColors.blue200);
  doc.rect(col1X, yPos, sigBoxWidth, sigBoxHeight, 'S');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PdfColors.black);
  doc.text('Technician', col1X + sigBoxWidth / 2, yPos + 3, { align: 'center' });

  // Technician Signature Image
  if (report.tech_signature) {
    try {
      doc.addImage(report.tech_signature, 'PNG', col1X + 2, yPos + 6, sigBoxWidth - 4, 18, undefined, 'FAST');
    } catch (error) {
      doc.setFontSize(6);
      doc.text('Signature unavailable', col1X + sigBoxWidth / 2, yPos + 15, { align: 'center' });
    }
  }

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text(report.tech_engineer || 'N/A', col1X + sigBoxWidth / 2, yPos + 28, { align: 'center' });
  
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PdfColors.grey);
  doc.text(`Mobile: ${report.tech_mobile || 'N/A'}`, col1X + sigBoxWidth / 2, yPos + 32, { align: 'center' });

  // Team Leader Signature Box (Green)
  doc.setFillColor(...PdfColors.green50);
  doc.rect(col2X, yPos, sigBoxWidth, sigBoxHeight, 'F');
  doc.setDrawColor(...PdfColors.green200);
  doc.rect(col2X, yPos, sigBoxWidth, sigBoxHeight, 'S');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PdfColors.black);
  doc.text('Team Leader', col2X + sigBoxWidth / 2, yPos + 3, { align: 'center' });

  // Team Leader Signature Image
  if (report.tl_signature) {
    try {
      doc.addImage(report.tl_signature, 'PNG', col2X + 2, yPos + 6, sigBoxWidth - 4, 18, undefined, 'FAST');
    } catch (error) {
      doc.setFontSize(6);
      doc.text('Signature unavailable', col2X + sigBoxWidth / 2, yPos + 15, { align: 'center' });
    }
  } else {
    doc.setFontSize(6);
    doc.setTextColor(...PdfColors.grey);
    doc.text('Pending approval', col2X + sigBoxWidth / 2, yPos + 15, { align: 'center' });
  }

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PdfColors.black);
  doc.text(report.tl_name || 'Pending', col2X + sigBoxWidth / 2, yPos + 28, { align: 'center' });
  
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PdfColors.grey);
  doc.text(`Mobile: ${report.tl_mobile || 'N/A'}`, col2X + sigBoxWidth / 2, yPos + 32, { align: 'center' });

  // Save PDF
  doc.save(`Report_${report.complaint_no}_${new Date().getTime()}.pdf`);
};

