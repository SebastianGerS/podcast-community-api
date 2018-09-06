import uuidv4 from 'uuid/v4';
import User from '../Models/User';

export function create(data) {
  const { res, body } = data;

  User.create({
    _id: uuidv4(),
    username: body.username,
    email: body.email,
    password: body.password,
    type: body.type,
  }, (error, user) => {
    if (error) {
      const message = JSON.stringify({ error: `error occurred when trying to register new user with ${error}` });
      return res.status(500).json({ message });
    }
    return res.status(200).json({ user });
  });
}


export function find(data) {
  const { res, id } = data;

  User.findById(id, (error, user) => {
    if (error) {
      const message = JSON.stringify({ error: `error occurred when trying to find the user: ${error}` });
      return res.status(500).json({ message });
    }

    return res.status(200).json({ user });
  });
}
