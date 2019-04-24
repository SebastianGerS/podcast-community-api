import multer from 'multer';
import uuidv1 from 'uuid/v1';

const storage = multer.diskStorage({
  destination: './src/public/images',
  filename(req, file, cb) {
    cb(null, `${uuidv1()}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|svg|png|gif/;
  const mimetype = filetypes.test(file.mimetype);
  const name = filetypes.test(file.originalname);

  if (mimetype && name) {
    return cb(null, true);
  }

  const fileTypeError = new Error();
  fileTypeError.errmsg = 'The file you tried to upload is of an invalid type, only the following filetypes are permited - jpeg, jpg, svg, png, gif';
  fileTypeError.status = 415;

  return cb(fileTypeError, false);
};


export function upload(key, req, res, next) {
  multer({ fileFilter, storage }).single(key)(req, res, (err) => {
    req.uploadError = err;
    next();
  });
}
