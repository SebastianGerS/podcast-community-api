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
  const { query, skip, limit } = input;
  const response = await new Promise((resolve, reject) => Model.find(query, fields)
    .skip(skip)
    .limit(limit)
    .exec((error, output) => {
      if (error) {
        reject(error);
      }
      if (output.length === 0) {
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

    (resolve, reject) => Model.findOneAndUpdate({ _id }, input, (error, output) => {
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
