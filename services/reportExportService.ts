// services/reportExportService.ts

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, HeadingLevel, AlignmentType } from 'docx';
import { LabReport } from '../types/upload';
import * as Print from 'expo-print';

/**
 * Convert technical medical terms to simple, understandable language
 */
const medicalTermsTranslation: { [key: string]: string } = {
  'hemoglobin': 'Hemoglobin (carries oxygen in blood)',
  'WBC': 'White Blood Cells (fight infections)',
  'RBC': 'Red Blood Cells (carry oxygen)',
  'platelets': 'Platelets (help blood clot)',
  'cholesterol': 'Cholesterol (fat in blood)',
  'glucose': 'Blood Sugar (energy source)',
  'creatinine': 'Creatinine (kidney function)',
  'albumin': 'Protein Level (body protein)',
  'bilirubin': 'Bilirubin (liver function)',
  'triglycerides': 'Triglycerides (fat type)',
  'TSH': 'Thyroid Function Test',
  'HDL': 'Good Cholesterol',
  'LDL': 'Bad Cholesterol',
  'BP': 'Blood Pressure',
  'SpO2': 'Oxygen Level in Blood',
  'ESR': 'Inflammation Test',
};

/**
 * Get simple interpretation of test results
 */
function getSimpleTestInterpretation(testName: string, status: string): string {
  const normalExplanations: { [key: string]: { [status: string]: string } } = {
    'hemoglobin': {
      'normal': '✅ Your blood is carrying oxygen well',
      'low': '⚠️ Your blood might not be carrying enough oxygen - eat iron-rich foods',
      'high': '⚠️ Your blood thickness is high - stay hydrated',
    },
    'wbc': {
      'normal': '✅ Your immune system is working well',
      'high': '⚠️ Your body might be fighting an infection',
      'low': '⚠️ Your immune system needs support - rest and boost immunity',
    },
    'glucose': {
      'normal': '✅ Your blood sugar is healthy',
      'high': '⚠️ Your blood sugar is high - reduce sugar and refined foods',
      'low': '⚠️ Your blood sugar is low - eat something quickly',
    },
    'cholesterol': {
      'normal': '✅ Your cholesterol is at a healthy level',
      'high': '⚠️ Your cholesterol is high - reduce oily foods and exercise more',
      'low': '✅ Your cholesterol is very low - that\'s good',
    },
  };

  const testKey = testName.toLowerCase().split('(')[0].trim();
  return normalExplanations[testKey]?.[status.toLowerCase()] || 
    `Test result: ${status} - Consult your doctor for detailed interpretation`;
}

/**
 * Generate PDF report using expo-print
 */
export async function generatePDFReport(reports: LabReport[]): Promise<string> {
  try {
    if (!reports || reports.length === 0) {
      throw new Error('No reports to export');
    }

    let htmlContent = `
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
              line-height: 1.6;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 3px solid #2196F3;
              padding-bottom: 15px;
            }
            .header h1 {
              color: #2196F3;
              margin: 0;
              font-size: 28px;
            }
            .header p {
              margin: 5px 0;
              color: #666;
              font-size: 12px;
            }
            .report {
              margin-bottom: 40px;
              page-break-inside: avoid;
              border: 1px solid #ddd;
              padding: 20px;
              border-radius: 8px;
              background-color: #f9f9f9;
            }
            .report-title {
              font-size: 18px;
              font-weight: bold;
              color: #2196F3;
              margin-bottom: 10px;
            }
            .report-meta {
              font-size: 12px;
              color: #666;
              margin-bottom: 15px;
              display: flex;
              flex-wrap: wrap;
              gap: 20px;
            }
            .meta-item {
              display: flex;
              gap: 5px;
            }
            .section {
              margin-bottom: 20px;
            }
            .section-title {
              font-size: 14px;
              font-weight: bold;
              color: #1565C0;
              margin-bottom: 10px;
              border-bottom: 2px solid #e3f2fd;
              padding-bottom: 5px;
            }
            .finding {
              margin-left: 15px;
              margin-bottom: 8px;
              font-size: 12px;
            }
            .finding.normal {
              color: #4CAF50;
            }
            .finding.abnormal {
              color: #F57C00;
            }
            .status {
              display: inline-block;
              padding: 8px 12px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: bold;
              margin: 10px 0;
            }
            .status.low {
              background-color: #E8F5E9;
              color: #2E7D32;
            }
            .status.moderate {
              background-color: #FFF3E0;
              color: #E65100;
            }
            .status.high {
              background-color: #FFEBEE;
              color: #C62828;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 10px;
              color: #999;
              text-align: center;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 10px 0;
              font-size: 12px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f0f0f0;
              font-weight: bold;
            }
            .page-break {
              page-break-after: always;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>HealthPath Report Summary</h1>
            <p>AI-Analyzed Medical Reports</p>
            <p>Generated: ${new Date().toLocaleString()}</p>
          </div>
    `;

    reports.forEach((report, index) => {
      const reportDate = report.uploadDate instanceof Date 
        ? report.uploadDate.toLocaleDateString() 
        : new Date(report.uploadDate as any).toLocaleDateString();
      
      htmlContent += `
        <div class="report">
          <div class="report-title">📋 ${report.labName || `Report ${index + 1}`}</div>
          <div class="report-meta">
            <div class="meta-item"><strong>Test Date:</strong> ${report.testDate || reportDate}</div>
            <div class="meta-item"><strong>Uploaded:</strong> ${reportDate}</div>
            <div class="meta-item"><strong>Type:</strong> ${report.reportType || 'General'}</div>
            <div class="meta-item"><strong>Tests:</strong> ${report.testResults?.length || 0}</div>
          </div>
      `;

      if (report.aiInterpretation) {
        htmlContent += `
          <div class="section">
            <div class="section-title">🤖 AI Analysis Summary</div>
            <p style="font-size: 12px; line-height: 1.6;">${report.aiInterpretation.summary || 'Analysis pending'}</p>
        `;

        if (report.aiInterpretation.riskLevel) {
          const statusClass = report.aiInterpretation.riskLevel.toLowerCase();
          htmlContent += `<div class="status ${statusClass}">Overall Status: ${report.aiInterpretation.riskLevel.toUpperCase()}</div>`;
        }

        htmlContent += '</div>';
      }

      if (report.aiInterpretation?.keyFindings && report.aiInterpretation.keyFindings.length > 0) {
        htmlContent += `
          <div class="section">
            <div class="section-title">🔍 Key Findings</div>
            ${report.aiInterpretation.keyFindings.map(f => `<div class="finding abnormal">• ${f}</div>`).join('')}
          </div>
        `;
      }

      if (report.aiInterpretation?.recommendations && report.aiInterpretation.recommendations.length > 0) {
        htmlContent += `
          <div class="section">
            <div class="section-title">💡 Doctor's Recommendations</div>
            ${report.aiInterpretation.recommendations.map((r, i) => `<div class="finding">${i + 1}. ${r}</div>`).join('')}
          </div>
        `;
      }

      if (report.testResults && report.testResults.length > 0) {
        htmlContent += `
          <div class="section">
            <div class="section-title">🔬 Detailed Test Results</div>
            <table>
              <tr>
                <th>Test Name</th>
                <th>Value</th>
                <th>Normal Range</th>
                <th>Status</th>
              </tr>
        `;

        report.testResults.forEach(test => {
          const statusClass = test.status?.toLowerCase() === 'normal' ? 'normal' : 'abnormal';
          htmlContent += `
            <tr>
              <td>${test.testName}</td>
              <td>${test.value} ${test.unit || ''}</td>
              <td>${test.normalRange || 'N/A'}</td>
              <td style="font-weight: bold; color: ${statusClass === 'normal' ? '#4CAF50' : '#F57C00'}">
                ${test.status || 'N/A'}
              </td>
            </tr>
          `;
        });

        htmlContent += `</table></div>`;
      }

      htmlContent += `</div>`;
      if (index < reports.length - 1) {
        htmlContent += `<div class="page-break"></div>`;
      }
    });

    htmlContent += `
          <div class="footer">
            <p>This report is confidential and for personal medical record purposes only.</p>
            <p>Share only with authorized healthcare providers.</p>
            <p>Generated by HealthPath • Keep this report safe</p>
          </div>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    
    const fileName = `HealthPath_Reports_${new Date().toISOString().split('T')[0]}.pdf`;
    const newPath = `${FileSystem.documentDirectory}${fileName}`;
    
    await FileSystem.copyAsync({
      from: uri,
      to: newPath,
    });

    return newPath;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

/**
 * Generate DOCX (Word) report - FIXED for React Native
 */
export async function generateDOCXReport(reports: LabReport[]): Promise<string> {
  try {
    if (!reports || reports.length === 0) {
      throw new Error('No reports to export');
    }

    const sections: any[] = [];

    sections.push(
      new Paragraph({
        text: 'HealthPath Report Summary',
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      new Paragraph({
        text: 'AI-Analyzed Medical Reports',
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      }),
      new Paragraph({
        text: `Generated: ${new Date().toLocaleString()}`,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );

    reports.forEach((report, reportIndex) => {
      const reportDate = report.uploadDate instanceof Date 
        ? report.uploadDate.toLocaleDateString() 
        : new Date(report.uploadDate as any).toLocaleDateString();

      sections.push(
        new Paragraph({
          text: `Report ${reportIndex + 1}: ${report.labName || 'Medical Report'}`,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        })
      );

      sections.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: 'Test Date' })] }),
                new TableCell({ children: [new Paragraph({ text: report.testDate || reportDate })] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: 'Lab Name' })] }),
                new TableCell({ children: [new Paragraph({ text: report.labName || 'N/A' })] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: 'Report Type' })] }),
                new TableCell({ children: [new Paragraph({ text: report.reportType || 'General' })] }),
              ],
            }),
          ],
        })
      );

      sections.push(new Paragraph({ text: '', spacing: { after: 200 } }));

      if (report.aiInterpretation) {
        sections.push(
          new Paragraph({
            text: 'AI Analysis Summary',
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 100, after: 100 },
          }),
          new Paragraph({
            text: report.aiInterpretation.summary || 'Analysis pending',
            spacing: { after: 100 },
          })
        );

        if (report.aiInterpretation.riskLevel) {
          sections.push(
            new Paragraph({
              text: `Overall Status: ${report.aiInterpretation.riskLevel.toUpperCase()}`,
              spacing: { after: 200 },
            })
          );
        }
      }

      if (report.aiInterpretation?.keyFindings && report.aiInterpretation.keyFindings.length > 0) {
        sections.push(
          new Paragraph({
            text: 'Key Findings',
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 100, after: 100 },
          })
        );

        report.aiInterpretation.keyFindings.forEach(finding => {
          sections.push(
            new Paragraph({
              text: finding,
              bullet: { level: 0 },
              spacing: { after: 50 },
            })
          );
        });

        sections.push(new Paragraph({ text: '', spacing: { after: 100 } }));
      }

      if (report.aiInterpretation?.recommendations && report.aiInterpretation.recommendations.length > 0) {
        sections.push(
          new Paragraph({
            text: "Doctor's Recommendations",
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 100, after: 100 },
          })
        );

        report.aiInterpretation.recommendations.forEach((rec, idx) => {
          sections.push(
            new Paragraph({
              text: `${idx + 1}. ${rec}`,
              spacing: { after: 50 },
            })
          );
        });

        sections.push(new Paragraph({ text: '', spacing: { after: 100 } }));
      }

      if (report.testResults && report.testResults.length > 0) {
        sections.push(
          new Paragraph({
            text: 'Test Results',
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 100, after: 100 },
          })
        );

        const tableRows = [
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ text: 'Test Name' })] }),
              new TableCell({ children: [new Paragraph({ text: 'Value' })] }),
              new TableCell({ children: [new Paragraph({ text: 'Normal Range' })] }),
              new TableCell({ children: [new Paragraph({ text: 'Status' })] }),
            ],
          }),
          ...report.testResults.map(
            test =>
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: test.testName })] }),
                  new TableCell({ children: [new Paragraph({ text: `${test.value} ${test.unit || ''}` })] }),
                  new TableCell({ children: [new Paragraph({ text: test.normalRange || 'N/A' })] }),
                  new TableCell({ children: [new Paragraph({ text: test.status || 'N/A' })] }),
                ],
              })
          ),
        ];

        sections.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: tableRows,
          })
        );
      }

      if (reportIndex < reports.length - 1) {
        sections.push(new Paragraph({ text: '', spacing: { after: 400 } }));
      }
    });

    sections.push(
      new Paragraph({
        text: '',
        spacing: { before: 400 },
      }),
      new Paragraph({
        text: 'This report is confidential and for personal medical record purposes only.',
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        text: 'Generated by HealthPath • Keep this report safe',
        alignment: AlignmentType.CENTER,
      })
    );

    const doc = new Document({
      sections: [{ children: sections }],
    });

    // ✅ FIX: Use toBase64String() instead of toBuffer() for React Native
    const base64String = await Packer.toBase64String(doc);
    
    const fileName = `HealthPath_Reports_${new Date().toISOString().split('T')[0]}.docx`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, base64String, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return filePath;
  } catch (error) {
    console.error('Error generating DOCX:', error);
    throw error;
  }
}

/**
 * Generate CSV report
 */
export async function generateCSVReport(reports: LabReport[]): Promise<string> {
  try {
    if (!reports || reports.length === 0) {
      throw new Error('No reports to export');
    }

    let csvContent = 'HealthPath Reports Export\n';
    csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;

    reports.forEach((report, reportIndex) => {
      const reportDate = report.uploadDate instanceof Date 
        ? report.uploadDate.toLocaleDateString() 
        : new Date(report.uploadDate as any).toLocaleDateString();

      csvContent += `REPORT ${reportIndex + 1}: ${report.labName || 'Medical Report'}\n`;
      csvContent += `Test Date,Lab Name,Report Type,Uploaded Date,Number of Tests\n`;
      csvContent += `"${report.testDate || reportDate}","${report.labName || 'N/A'}","${report.reportType || 'General'}","${reportDate}","${report.testResults?.length || 0}"\n\n`;

      if (report.aiInterpretation) {
        csvContent += `AI SUMMARY\n`;
        csvContent += `"${(report.aiInterpretation.summary || '').replace(/"/g, '""')}"\n`;
        csvContent += `Risk Level,"${report.aiInterpretation.riskLevel || 'N/A'}"\n\n`;
      }

      if (report.testResults && report.testResults.length > 0) {
        csvContent += `TEST RESULTS\n`;
        csvContent += `Test Name,Value,Unit,Normal Range,Status\n`;
        report.testResults.forEach(test => {
          csvContent += `"${test.testName}","${test.value}","${test.unit || ''}","${test.normalRange || 'N/A'}","${test.status || 'N/A'}"\n`;
        });
        csvContent += `\n`;
      }

      csvContent += `\n\n`;
    });

    const fileName = `HealthPath_Reports_${new Date().toISOString().split('T')[0]}.csv`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    return filePath;
  } catch (error) {
    console.error('Error generating CSV:', error);
    throw error;
  }
}

/**
 * Share exported file
 */
export async function shareExportedFile(filePath: string): Promise<void> {
  try {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, {
        mimeType: getMimeType(filePath),
        dialogTitle: 'Share HealthPath Report',
        UTI: getUTI(filePath),
      });
    } else {
      Alert.alert('Sharing not available', 'Your device does not support sharing');
    }
  } catch (error) {
    console.error('Error sharing file:', error);
    throw error;
  }
}

/**
 * Download file to device storage (simplified version without media library)
 * The file is already saved to the app's document directory and can be accessed via share
 */
export async function downloadFile(filePath: string): Promise<void> {
  try {
    // For now, we'll just confirm the file exists
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    
    if (!fileInfo.exists) {
      throw new Error('File not found');
    }

    console.log('File saved successfully at:', filePath);
    
    // On mobile, files in documentDirectory are accessible
    // User can access them through the Files app or share them
  } catch (error) {
    console.error('Error with file:', error);
    throw error;
  }
}

/**
 * Get MIME type based on file extension
 */
function getMimeType(filePath: string): string {
  if (filePath.endsWith('.pdf')) return 'application/pdf';
  if (filePath.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (filePath.endsWith('.csv')) return 'text/csv';
  return 'application/octet-stream';
}

/**
 * Get UTI (Uniform Type Identifier) for iOS
 */
function getUTI(filePath: string): string {
  if (filePath.endsWith('.pdf')) return 'com.adobe.pdf';
  if (filePath.endsWith('.docx')) return 'org.openxmlformats.wordprocessingml.document';
  if (filePath.endsWith('.csv')) return 'public.comma-separated-values-text';
  return 'public.data';
}
