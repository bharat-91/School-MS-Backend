import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

interface StudentInfo {
    firstName: string;
    lastName: string;
    dob: Date;
    studentUniqueNo: string;
}

interface MarksDetails {
    grade: string;
    rank?: string;
    status: string;
    // studentId: string;
    departmentName: string;
    totalMarks: number;
    obtainMarks: number;
    percentage:number
}

interface departmentDetails {
    department: string
}

export const generateMarksPDF = async (data: MarksDetails, student: StudentInfo, departmentInfo: departmentDetails): Promise<Uint8Array> => {
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
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        const x = options.align === 'center' ? (width - textWidth) / 2 : margin;
        page.drawText(text, {
            x,
            y: cursorY,
            size: fontSize,
            font: options.bold ? fontBold : font,
            color: rgb(0, 0, 0)
        });
        cursorY -= fontSize + 10;
    };

    const drawColoredText = (text: string, fontSize: number, color: any = rgb(0, 0, 0)) => {
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        const x = margin;
        page.drawText(text, {
            x,
            y: cursorY,
            size: fontSize,
            font,
            color
        });
        cursorY -= fontSize + 10;
    };

    drawText(`Department name: ${departmentInfo.department}`, fontSizeTitle, { align: 'center' });

    cursorY -= 20; 

    drawText("Student Information", fontSizeSection, { bold: true });
    drawText(`Name: ${student.firstName} ${student.lastName}`, fontSizeText);
    drawText(`DOB: ${student.dob.toDateString()}`, fontSizeText);
    drawText(`Student Unique No: ${student.studentUniqueNo}`, fontSizeText);

    cursorY -= 20;  

    drawText("Marks Details", fontSizeSection, { bold: true });
    drawText(`Department: ${data.departmentName}`, fontSizeText);
    drawText(`Total Marks: ${data.totalMarks}`, fontSizeText);
    drawText(`Obtain Marks: ${data.obtainMarks}`, fontSizeText);
    drawText(`Grade: ${data.grade}`, fontSizeText);
    drawText(`Rank: ${data.rank}`, fontSizeText);
    drawText(`Status: ${data.status}`, fontSizeText);
    drawText(`Percentage: ${data.percentage}`, fontSizeText);

    if (data.status.toLowerCase() === 'pass') {
        drawColoredText(`Status: ${data.status}`, fontSizeText, rgb(0, 0.6, 0));
    } else {
        drawColoredText(`Status: ${data.status}`, fontSizeText, rgb(0.8, 0, 0)); 
    }


    cursorY -= 30;
    drawText(`Date: ${new Date().toDateString()}`, fontSizeText, { align: 'right' });


    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
};

