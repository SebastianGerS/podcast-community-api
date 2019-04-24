/* eslint-disable global-require */
import cloudinary from 'cloudinary';
import fs from 'fs';
import fileType from 'file-type';
import isSvg from 'is-svg';

if (!process.env.PORT) {
  require('dotenv').config();
}

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

async function removeFile(path) {
  const removedFile = await fs.unlink(path, (error) => {
    if (error) {
      return error;
    }
    return true;
  });

  return removedFile;
}

export async function uploadProfileImageToCloudinary(userId, path) {
  const destroyPrevius = await cloudinary.v2.uploader.destroy(`${process.env.ENVIRONMENT}/${userId}`).catch(error => error);

  if (destroyPrevius.result !== 'ok' || destroyPrevius.result !== 'not found') {
    const newProfileImage = await cloudinary.v2.uploader.upload(path,
      {
        // moderation: 'aws_rek',
        /* filters explicit images
           TODO pay for addon to enable using this for more then 50 request/month
        */
        eager:
        [
          {
            width: 660, height: 660, gravity: 'auto', crop: 'fill',
          },
        ],
        public_id: `${process.env.ENVIRONMENT}/${userId}`,
      }).catch(error => error);

    await removeFile(path);

    if (newProfileImage.http_code) {
      const cloudinaryError = new Error();
      cloudinaryError.errmsg = newProfileImage.message;
      cloudinaryError.status = newProfileImage.http_code;
      return cloudinaryError;
    }

    if (newProfileImage.moderation) {
      if (newProfileImage.moderation[0].status === 'rejected') {
        const cloudinaryError = new Error();
        cloudinaryError.errmsg = 'The image was rejected due to explicit content';
        cloudinaryError.status = 403;
        return cloudinaryError;
      }
    }


    return newProfileImage;
  }

  await removeFile(path);

  const cloudinaryError = new Error();
  cloudinaryError.errmsg = destroyPrevius.message;
  cloudinaryError.status = destroyPrevius.http_code;

  return cloudinaryError;
}

export async function invalidImage(file) {
  const buffer = fs.readFileSync(file.path);
  const extractedType = fileType(buffer);

  const isInvalid = extractedType
    ? extractedType.mime !== file.mimetype
    : !(isSvg(buffer) && file.mimetype === 'image/svg+xml');

  if (isInvalid) {
    await removeFile(file.path);
  }

  return isInvalid;
}
