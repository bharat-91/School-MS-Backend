import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { User } from "../model";

interface RevenueData {
  details: DepartmentDetails[];
}

interface DepartmentDetails {
  departmentName: string;
  totalStudents: number;
  totalFeesCollected: number;
  totalPenaltyCollected: number;
  departmentId: string;
  totalPaidStudents: number;
  totalUnpaidStudents: number;
  students: Student[];
}

interface Student {
  studentId: string;
  hasPaidFees: boolean;
  userName:string
}

export const generateRevenuePdf = async (data: RevenueData): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const margin = 50;
  const fontSizeTitle = 25;
  const fontSizeSection = 18;
  const fontSizeText = 14;
  const lineHeight = fontSizeText + 10;
  
  let page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  let cursorY = height - margin;

  const addPage = () => {
    page = pdfDoc.addPage();
    cursorY = height - margin;
  };

  const drawText = (text: string, fontSize: number, options: any = {}) => {
    if (cursorY < margin) {
      addPage();
    }
    page.drawText(text, {
      x: margin,
      y: cursorY,
      size: fontSize,
      font: options.bold ? fontBold : font,
      color: rgb(0, 0, 0),
    });
    cursorY -= lineHeight;
  };

  drawText("Department Revenue Report", fontSizeTitle, { align: "center", x: width / 2 - margin });
  cursorY -= 20;

  data.details.forEach(department => {
    drawText(`Department: ${department.departmentName}`, fontSizeSection, { bold: true });
    drawText(`Total Students: ${department.totalStudents}`, fontSizeText);
    drawText(`Total Fees Collected: $${department.totalFeesCollected.toFixed(2)}`, fontSizeText);
    drawText(`Total Penalty Collected: $${department.totalPenaltyCollected.toFixed(2)}`, fontSizeText);
    drawText(`Total Paid Students: ${department.totalPaidStudents}`, fontSizeText);
    drawText(`Total Unpaid Students: ${department.totalUnpaidStudents}`, fontSizeText);
    
    cursorY -= 20;
    
    department.students.forEach (student => {
      drawText(`Student ID: ${student.studentId}`, fontSizeText);
      drawText(`Student Name: ${student.userName}`, fontSizeText);
      drawText(`Has Paid Fees: ${student.hasPaidFees ? 'Yes' : 'No'}`, fontSizeText);
      cursorY -= 10;
    });
    
    cursorY -= 20;
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
};
