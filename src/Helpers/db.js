import bcrypt from 'bcryptjs';
import { updateArray } from './general';

export async function create(Model, input) {
  const response = await new Promise(
    (resolve, reject) => Model.create(input, (error, output) => {
      if (error) reject(error);
      resolve(output);
    }),
  );
  return response;
}

export async function findById(Model, id) {
  const response = await new Promise(
    (resolve, reject) => Model.findById(id, (error, output) => {
      if (error) reject(error);
      if (!output) {
        const notFoundError = new Error();
        notFoundError.errmsg = 'Not found';
        reject(notFoundError);
      }
      resolve(output);
    }),
  );
  return response;
}

export async function findOne(Model, input) {
  const response = await new Promise(
    (resolve, reject) => Model.findOne(input, (error, output) => {
      if (error) reject(error);
      if (!output) {
        const NotFoundError = new Error();
        NotFoundError.errmsg = 'Not found';
        reject(NotFoundError);
      }
      resolve(output);
    }),
  );
  return response;
}

export async function find(Model, fields, input) {
  const {
    query, skip, limit, sort,
  } = input;

  const response = await new Promise((resolve, reject) => Model.find(query, fields)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .exec((error, output) => {
      if (error) {
        reject(error);
      }
      if (!output) {
        const NotFoundError = new Error();
        NotFoundError.errmsg = 'No results where found';
        reject(NotFoundError);
      } else if (output.length === 0) {
        const NotFoundError = new Error();
        NotFoundError.errmsg = 'No results where found';
        reject(NotFoundError);
      }

      resolve(output);
    }));
  return response;
}

export async function update(Model, _id, input) {
  const response = await new Promise(

    (resolve, reject) => Model.updateOne({ _id }, input, (error, output) => {
      if (error) reject(error);
      if (!output) {
        const NotFoundError = new Error();
        NotFoundError.errmsg = 'Not found';
        reject(NotFoundError);
      }
      resolve(output);
    }),
  );
  return response;
}

export async function findAndUpdate(Model, _id, input) {
  const response = await new Promise(

    (resolve, reject) => Model.findOneAndUpdate({ _id }, input, { new: true }, (error, output) => {
      if (error) reject(error);
      if (!output) {
        const NotFoundError = new Error();
        NotFoundError.errmsg = 'Not found';
        reject(NotFoundError);
      }
      resolve(output);
    }),
  );
  return response;
}

export async function handleUpdate(Model, modelArrays, id, body) {
  const input = {};
  const model = await findById(Model, id).catch(error => error);
  if (model.errmsg) return model;
  Object.keys(body).map((key) => {
    if (modelArrays.includes(key)) {
      input[key] = updateArray(model[key], body[key]);
    } else {
      input[key] = body[key];
    }
    return input;
  });
  const response = await update(Model, id, input).catch(error => error);

  return response;
}

export async function deleteOne(Model, input) {
  const response = await new Promise(
    (resolve, reject) => Model.deleteOne(input, (error, output) => {
      if (error) reject(error);
      if (!output) {
        const NotFoundError = new Error();
        NotFoundError.errmsg = 'Not found';
        reject(NotFoundError);
      }
      resolve(output);
    }),
  );
  return response;
}

export async function hashPassword(password) {
  const rounds = 5;
  const newSalt = await bcrypt.genSalt(rounds).catch(error => error);
  const passwordHash = await bcrypt.hash(password, newSalt).catch(error => error);
  return passwordHash;
}
