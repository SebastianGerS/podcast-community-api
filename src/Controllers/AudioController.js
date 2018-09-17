import request from 'request';

export default {
  async stream(req, res) {
    const url = `https://www.listennotes.com/e/p/${req.params.audioUrl}`;
    const r = request(url, (err, data) => {
      if (err) return err;

      return data;
    });

    req.pipe(r).pipe(res);
  },
};
