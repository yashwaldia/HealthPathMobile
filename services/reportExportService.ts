// services/reportExportService.ts

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  WidthType,
  HeadingLevel,
  AlignmentType,
} from 'docx';
import * as Print from 'expo-print';
import { LabReport } from '../types/upload';
import { RadiologyAnalysis } from '../types/radiology';

/**
 * Convert technical medical terms to simple, understandable language
 */
const medicalTermsTranslation: { [key: string]: string } = {
  hemoglobin: 'Hemoglobin (carries oxygen in blood)',
  WBC: 'White Blood Cells (fight infections)',
  RBC: 'Red Blood Cells (carry oxygen)',
  platelets: 'Platelets (help blood clot)',
  cholesterol: 'Cholesterol (fat in blood)',
  glucose: 'Blood Sugar (energy source)',
  creatinine: 'Creatinine (kidney function)',
  albumin: 'Protein Level (body protein)',
  bilirubin: 'Bilirubin (liver function)',
  triglycerides: 'Triglycerides (fat type)',
  TSH: 'Thyroid Function Test',
  HDL: 'Good Cholesterol',
  LDL: 'Bad Cholesterol',
  BP: 'Blood Pressure',
  SpO2: 'Oxygen Level in Blood',
  ESR: 'Inflammation Test',
};

/**
 * Get simple interpretation of test results
 */
function getSimpleTestInterpretation(testName: string, status: string): string {
  const normalExplanations: { [key: string]: { [status: string]: string } } = {
    hemoglobin: {
      normal: '✅ Your blood is carrying oxygen well',
      low: '⚠️ Your blood might not be carrying enough oxygen - eat iron-rich foods',
      high: '⚠️ Your blood thickness is high - stay hydrated',
    },
    wbc: {
      normal: '✅ Your immune system is working well',
      high: '⚠️ Your body might be fighting an infection',
      low: '⚠️ Your immune system needs support - rest and boost immunity',
    },
    glucose: {
      normal: '✅ Your blood sugar is healthy',
      high: '⚠️ Your blood sugar is high - reduce sugar and refined foods',
      low: '⚠️ Your blood sugar is low - eat something quickly',
    },
    cholesterol: {
      normal: '✅ Your cholesterol is at a healthy level',
      high: '⚠️ Your cholesterol is high - reduce oily foods and exercise more',
      low: "✅ Your cholesterol is very low - that's good",
    },
  };

  const testKey = testName.toLowerCase().split('(')[0].trim();
  return (
    normalExplanations[testKey]?.[status.toLowerCase()] ||
    `Test result: ${status} - Consult your doctor for detailed interpretation`
  );
}

/**
 * Generate PDF report for lab reports using expo-print
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
      const reportDate =
        report.uploadDate instanceof Date
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
            <p style="font-size: 12px; line-height: 1.6;">${
              report.aiInterpretation.summary || 'Analysis pending'
            }</p>
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
            ${report.aiInterpretation.keyFindings
              .map((f) => `<div class="finding abnormal">• ${f}</div>`)
              .join('')}
          </div>
        `;
      }

      if (
        report.aiInterpretation?.recommendations &&
        report.aiInterpretation.recommendations.length > 0
      ) {
        htmlContent += `
          <div class="section">
            <div class="section-title">💡 Doctor's Recommendations</div>
            ${report.aiInterpretation.recommendations
              .map((r, i) => `<div class="finding">${i + 1}. ${r}</div>`)
              .join('')}
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

        report.testResults.forEach((test) => {
          const statusClass = test.status?.toLowerCase() === 'normal' ? 'normal' : 'abnormal';
          htmlContent += `
            <tr>
              <td>${test.testName}</td>
              <td>${test.value} ${test.unit || ''}</td>
              <td>${test.normalRange || 'N/A'}</td>
              <td style="font-weight: bold; color: ${
                statusClass === 'normal' ? '#4CAF50' : '#F57C00'
              }">
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
 * Generate DOCX (Word) report for lab reports - React Native safe
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
      const reportDate =
        report.uploadDate instanceof Date
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
                new TableCell({
                  children: [new Paragraph({ text: report.testDate || reportDate })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: 'Lab Name' })] }),
                new TableCell({
                  children: [new Paragraph({ text: report.labName || 'N/A' })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: 'Report Type' })] }),
                new TableCell({
                  children: [new Paragraph({ text: report.reportType || 'General' })],
                }),
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

      if (
        report.aiInterpretation?.keyFindings &&
        report.aiInterpretation.keyFindings.length > 0
      ) {
        sections.push(
          new Paragraph({
            text: 'Key Findings',
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 100, after: 100 },
          })
        );

        report.aiInterpretation.keyFindings.forEach((finding) => {
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

      if (
        report.aiInterpretation?.recommendations &&
        report.aiInterpretation.recommendations.length > 0
      ) {
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
            (test) =>
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: test.testName })] }),
                  new TableCell({
                    children: [new Paragraph({ text: `${test.value} ${test.unit || ''}` })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: test.normalRange || 'N/A' })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: test.status || 'N/A' })],
                  }),
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
 * Generate PDF for a single radiology analysis (Radiology-specific path)
 */
export async function generateRadiologyPDF(
  analysis: RadiologyAnalysis
): Promise<string> {
  try {
    if (!analysis) {
      throw new Error('No radiology analysis to export');
    }

    const examType = analysis.examType || 'Radiology';
    const bodyPart = analysis.bodyPart || 'Unknown area';

    const htmlContent = `
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
              border-bottom: 3px solid #EF6C00;
              padding-bottom: 15px;
            }
            .header h1 {
              color: #EF6C00;
              margin: 0;
              font-size: 26px;
            }
            .header p {
              margin: 5px 0;
              color: #666;
              font-size: 12px;
            }
            .section {
              margin-bottom: 20px;
            }
            .section-title {
              font-size: 14px;
              font-weight: bold;
              color: #BF360C;
              margin-bottom: 10px;
              border-bottom: 2px solid #FFE0B2;
              padding-bottom: 5px;
            }
            .badge {
              display: inline-block;
              padding: 6px 10px;
              border-radius: 4px;
              font-size: 11px;
              font-weight: bold;
              margin: 4px 4px 10px 0;
            }
            .badge-label {
              background-color: #FFF3E0;
              color: #E65100;
            }
            .urgency {
              background-color: #FFEBEE;
              color: #C62828;
            }
            .urgency-routine {
              background-color: #E8F5E9;
              color: #2E7D32;
            }
            ul {
              padding-left: 18px;
              font-size: 12px;
            }
            li {
              margin-bottom: 6px;
            }
            .disclaimer {
              font-size: 11px;
              color: #777;
              margin-top: 10px;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 10px;
              color: #999;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>HealthPath Radiology Analysis</h1>
            <p>AI-assisted educational interpretation of your radiology scan</p>
            <p>Generated: ${new Date().toLocaleString()}</p>
          </div>

          <div class="section">
            <div class="section-title">Scan Details</div>
            <p><strong>Exam Type:</strong> ${examType}</p>
            <p><strong>Body Part:</strong> ${bodyPart}</p>
            <p><strong>Scan Date:</strong> ${analysis.scanDate || 'Not specified'}</p>
            <p><strong>File Name:</strong> ${analysis.fileName}</p>
          </div>

          <div class="section">
            <div class="section-title">Summary</div>
            <p style="font-size: 13px;">${analysis.summary}</p>
          </div>

          ${
            analysis.keyFindings && analysis.keyFindings.length
              ? `
          <div class="section">
            <div class="section-title">Key Findings</div>
            <ul>
              ${analysis.keyFindings.map((f) => `<li>${f}</li>`).join('')}
            </ul>
          </div>`
              : ''
          }

          ${
            analysis.recommendations && analysis.recommendations.length
              ? `
          <div class="section">
            <div class="section-title">Recommendations</div>
            <ul>
              ${analysis.recommendations.map((r) => `<li>${r}</li>`).join('')}
            </ul>
          </div>`
              : ''
          }

          ${
            analysis.followUpActions && analysis.followUpActions.length
              ? `
          <div class="section">
            <div class="section-title">Follow-up Actions</div>
            <ul>
              ${analysis.followUpActions.map((a) => `<li>${a}</li>`).join('')}
            </ul>
          </div>`
              : ''
          }

          <div class="footer">
            <p>HealthPath Radiology Assistant</p>
            <p>Keep this report secure and share only with trusted healthcare providers.</p>
          </div>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html: htmlContent });

    const safeExam = examType.replace(/\s+/g, '');
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `HealthPath_Radiology_${safeExam}_${dateStr}.pdf`;
    const newPath = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.copyAsync({
      from: uri,
      to: newPath,
    });

    return newPath;
  } catch (error) {
    console.error('Error generating Radiology PDF:', error);
    throw error;
  }
}

/**
 * Generate DOCX for a single radiology analysis (Radiology-specific path)
 */
export async function generateRadiologyDOCX(
  analysis: RadiologyAnalysis
): Promise<string> {
  try {
    if (!analysis) {
      throw new Error('No radiology analysis to export');
    }

    const examType = analysis.examType || 'Radiology';
    const bodyPart = analysis.bodyPart || 'Unknown area';

    const sections: any[] = [];

    sections.push(
      new Paragraph({
        text: 'HealthPath Radiology Analysis',
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      new Paragraph({
        text: 'AI-assisted educational interpretation of your radiology scan',
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
      }),
      new Paragraph({
        text: `Generated: ${new Date().toLocaleString()}`,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );

    sections.push(
      new Paragraph({
        text: 'Scan Details',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      }),
      new Paragraph({ text: `Exam Type: ${examType}`, spacing: { after: 50 } }),
      new Paragraph({ text: `Body Part: ${bodyPart}`, spacing: { after: 50 } }),
      new Paragraph({
        text: `Scan Date: ${analysis.scanDate || 'Not specified'}`,
        spacing: { after: 50 },
      }),
      new Paragraph({
        text: `File Name: ${analysis.fileName}`,
        spacing: { after: 200 },
      })
    );

    sections.push(
      new Paragraph({
        text: 'Summary',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      }),
      new Paragraph({
        text: analysis.summary,
        spacing: { after: 200 },
      })
    );

    if (analysis.keyFindings && analysis.keyFindings.length > 0) {
      sections.push(
        new Paragraph({
          text: 'Key Findings',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        })
      );

      analysis.keyFindings.forEach((finding) => {
        sections.push(
          new Paragraph({
            text: finding,
            bullet: { level: 0 },
            spacing: { after: 50 },
          })
        );
      });

      sections.push(new Paragraph({ text: '', spacing: { after: 200 } }));
    }

    if (analysis.recommendations && analysis.recommendations.length > 0) {
      sections.push(
        new Paragraph({
          text: 'Recommendations',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        })
      );

      analysis.recommendations.forEach((rec, idx) => {
        sections.push(
          new Paragraph({
            text: `${idx + 1}. ${rec}`,
            spacing: { after: 50 },
          })
        );
      });

      sections.push(new Paragraph({ text: '', spacing: { after: 200 } }));
    }

    if (analysis.followUpActions && analysis.followUpActions.length > 0) {
      sections.push(
        new Paragraph({
          text: 'Follow-up Actions',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        })
      );

      analysis.followUpActions.forEach((action, idx) => {
        sections.push(
          new Paragraph({
            text: `${idx + 1}. ${action}`,
            spacing: { after: 50 },
          })
        );
      });

      sections.push(new Paragraph({ text: '', spacing: { after: 200 } }));
    }

    sections.push(
      new Paragraph({
        text: 'AI Confidence & Safety',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      }),
      new Paragraph({
        text: `AI Model: ${analysis.aiModel}`,
        spacing: { after: 50 },
      }),
      new Paragraph({
        text: `Confidence: ${(analysis.confidence * 100).toFixed(0)}%`,
        spacing: { after: 200 },
      }),
      new Paragraph({
        text:
          'This AI-generated analysis is for educational purposes only and is not a medical diagnosis.',
        spacing: { after: 50 },
      }),
      new Paragraph({
        text:
          'Always consult a licensed radiologist or healthcare professional for official interpretation and medical decisions.',
        spacing: { after: 200 },
      })
    );

    const doc = new Document({
      sections: [{ children: sections }],
    });

    const base64String = await Packer.toBase64String(doc);

    const safeExam = examType.replace(/\s+/g, '');
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `HealthPath_Radiology_${safeExam}_${dateStr}.docx`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, base64String, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return filePath;
  } catch (error) {
    console.error('Error generating Radiology DOCX:', error);
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
 * Download file to device storage (simplified)
 */
export async function downloadFile(filePath: string): Promise<void> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(filePath);

    if (!fileInfo.exists) {
      throw new Error('File not found');
    }

    console.log('File saved successfully at:', filePath);
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
  if (filePath.endsWith('.docx'))
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  return 'application/octet-stream';
}

/**
 * Get UTI (Uniform Type Identifier) for iOS
 */
function getUTI(filePath: string): string {
  if (filePath.endsWith('.pdf')) return 'com.adobe.pdf';
  if (filePath.endsWith('.docx')) return 'org.openxmlformats.wordprocessingml.document';
  return 'public.data';
}
