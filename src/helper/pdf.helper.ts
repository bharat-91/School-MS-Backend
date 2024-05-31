import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface Student {
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  phoneNumber: string;
  dob: Date;
  gender: string;
  address: string;
  role: string;
}

interface FeesDetails {
  endDate: Date;
  daysDelayed: number;
  paymentMode: string;
  status: string;
  amount: number;
  penalty: number;
}

export const generatePdf = async (student: Student, feesDetails: FeesDetails): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const fontSizeTitle = 25;
  const fontSizeSection = 18;
  const fontSizeText = 14;

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const margin = 50;
  let cursorY = height - margin;

  const drawText = (text: string, fontSize: number, options: any = {}) => {
    page.drawText(text, {
      x: margin,
      y: cursorY,
      size: fontSize,
      font: options.bold ? fontBold : font,
      color: rgb(0, 0, 0),

      ...options
    });
    cursorY -= fontSize + 10;
  };

  drawText('Fees Details', fontSizeTitle, { align: "center", x: 225 });
  cursorY -= 20;

  drawText('Student Details', fontSizeSection, { bold: true });
  drawText(`Name: ${student.firstName} ${student.lastName}`, fontSizeText);
  drawText(`Email: ${student.email}`, fontSizeText);
  drawText(`Phone Number: ${student.phoneNumber}`, fontSizeText);
  drawText(`Date of Birth: ${student.dob.toLocaleDateString()}`, fontSizeText);
  drawText(`Gender:  ${student.gender}`, fontSizeText);
  drawText(`Address:  ${student.address}`, fontSizeText);

  cursorY -= 20;

  drawText('Payment Details', fontSizeSection, { bold: true });
  drawText(`End Date: ${feesDetails.endDate.toLocaleDateString()}`, fontSizeText);
  drawText(`Days Delayed: ${feesDetails.daysDelayed}`, fontSizeText);
  drawText(`Payment Mode: ${feesDetails.paymentMode}`, fontSizeText);
  drawText(`Status: ${feesDetails.status}`, fontSizeText);
  drawText(`Amount:  $${(feesDetails.amount - feesDetails.penalty).toFixed(2)}`, fontSizeText);
  drawText(`Penalty: $${feesDetails.penalty.toFixed(2)}`, fontSizeText);
  drawText(`Total Amount:  $${(feesDetails.amount).toFixed(2)}`, fontSizeText);

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
};
