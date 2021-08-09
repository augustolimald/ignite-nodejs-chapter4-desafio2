import supertest from 'supertest';
import { Connection, createConnection } from 'typeorm';

import { app } from '../../../../app';
import { User } from '../../entities/User';
import { UsersRepository } from '../../repositories/UsersRepository';
import { IUsersRepository } from '../../repositories/IUsersRepository';
import { CreateUserUseCase } from '../createUser/CreateUserUseCase';

let user: User;
let usersRepository: IUsersRepository;
let createUserUseCase: CreateUserUseCase;

let connection: Connection;
const request = supertest(app);

describe('Authenticate User Test Case', () => {
    beforeAll(async () => {
        connection = await createConnection();
        await connection.runMigrations();

        usersRepository = new UsersRepository();
        createUserUseCase = new CreateUserUseCase(usersRepository);
        user = await createUserUseCase.execute({
            name: 'Fulano da Silva',
            email: 'fulano@gmail.com',
            password: '1234',
        });
    });

    afterAll(async () => {
        await connection.dropDatabase();
        await connection.close();
    });

    it('should be able to login with email and password', async () => {
        const { body } = await request
            .post('/api/v1/sessions')
            .send({
                email: 'fulano@gmail.com',
                password: '1234'
            })
            .expect(200);
        
        expect(body).toHaveProperty('token');
    });

    it('should not be able to login with incorrect email or password', async () => {
        await request
            .post('/api/v1/sessions')
            .send({
                email: 'fulanoooo@gmail.com',
                password: '1234'
            })
            .expect(401);
        
        await request
            .post('/api/v1/sessions')
            .send({
                email: 'fulano@gmail.com',
                password: '12345'
            })
            .expect(401);
    });
});