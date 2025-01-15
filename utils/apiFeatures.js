class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // 1A) Filtering
    const queryObject = { ...this.queryString }; // get query string from the request
    const excludedFields = ['page', 'sort', 'limit', 'fields']; // exclude these words from the query string object if found
    excludedFields.forEach(el => delete queryObject[el]);

    // 1B) Advanced Filtering e.g (price=[gte] => {$gte})
    let queryStr = JSON.stringify(queryObject); // convert query obj to string
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`); // add $ to the string (so mongoose understand it)

    this.query = this.query.find(JSON.parse(queryStr)); // query data from model
    //  let query = Tour.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy); // e.g .sort('ratings') || .sort('-ratings')
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields
        .split(',')
        .map(field => field.trim())
        .join(' ');
      this.query = this.query.select(fields); // query these fields => https://__/api/v1resouce?fields=name,price,duration
    } else {
      this.query = this.query.select('-__v');
    }

    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 10;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
