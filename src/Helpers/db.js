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
        notFoundError.errmsg = 'user not found';
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
        NotFoundError.errmsg = 'user not found';
        reject(NotFoundError);
      }
      resolve(output);
    }),
  );
  return response;
}

export async function find(Model, fields, input) {
  const { query, options } = input;
  const response = await new Promise(
    (resolve, reject) => Model.find(query, fields, options, (error, output) => {
      if (error) {
        reject(error);
      }
      if (output.length === 0) {
        const NotFoundError = new Error();
        NotFoundError.errmsg = 'no user was found';
        reject(NotFoundError);
      }
      resolve(output);
    }),
  );
  return response;
}
