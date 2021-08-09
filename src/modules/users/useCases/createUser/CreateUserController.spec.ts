import supertest from 'supertest';
import { Connection, createConnection } from 'typeorm';

import { app } from '../../../../app';

let connection: Connection;
const request = supertest(app);

describe('User Profile Test Case', () => {
    beforeAll(async () => {
        connection = await createConnection();
        await connection.runMigrations();
    });

    afterAll(async () => {
        await connection.dropDatabase();
        await connection.close();
    });

    it('should be able to create a new user', async () => {
        await request
            .post('/api/v1/users')
            .send({
                name: 'Fulano da Silva',
                email: 'fulano.silva@gmail.com',
                password: '1234'
            })
            .expect(201);
    });

    it('should not be able to create multiple users with the same email', async () => {
        await request
            .post('/api/v1/users')
            .send({
                name: 'Fulanoo da Silva',
                email: 'fulanoo.silva@gmail.com',
                password: '1234'
            })
            .expect(201);

        await request
            .post('/api/v1/users')
            .send({
                name: 'Fulanoo da Silva',
                email: 'fulanoo.silva@gmail.com',
                password: '1234'
            })
            .expect(400);
    });
});