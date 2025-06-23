db = db.getSiblingDB('admin');
db.createUser({
  user: 'admin',
  pwd: 'password123',
  roles: [
    { role: 'root', db: 'admin' },
    { role: 'dbOwner', db: 'IMDB' },
    { role: 'readWrite', db: 'IMDB' }
  ]
});

db = db.getSiblingDB('IMDB');
// Create collections if they don't exist
db.createCollection('title.basics');
db.createCollection('title.ratings');
db.createCollection('title.principals');
db.createCollection('name.basics'); 