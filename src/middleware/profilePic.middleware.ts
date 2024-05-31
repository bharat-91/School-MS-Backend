import { Request, Response } from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';

const storage = multer.diskStorage({
    destination: function (req, file, callBack) {
        callBack(null, 'src/uploads/');
    },
    filename: function (req, file, callBack) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        callBack(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
    }
});

const customFileFilter = (req: Request, res: Response, file: Express.Multer.File, callBack: FileFilterCallback) => {
    if (file.mimetype.startsWith('image/')) {
        callBack(null, true);
    } else {
        res.status(400).json({ error: 'Only images are allowed!' });
        callBack(null, false);
    }
};

const upload = multer({
    storage: storage, fileFilter: (req, file, callBack) => {
        customFileFilter(req, req.res as Response, file, callBack);
    }, limits: { fileSize: 1024*1024*2, },
});

export default upload;
