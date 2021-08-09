import supertest from 'supertest';
import { Connection, createConnection } from 'typeorm';

import { app } from '../../../../app';
import { User } from '../../entities/User';
import { UsersRepository } from '../../repositories/UsersRepository';
import { IUsersRepository } from '../../repositories/IUsersRepository';
import { CreateUserUseCase } from '../createUser/CreateUserUseCase';
import { AuthenticateUserUseCase } from '../authenticateUser/AuthenticateUserUseCase';

let user: User;
let token: string;
let usersRepository: IUsersRepository;
let createUserUseCase: CreateUserUseCase;
let authenticateUserUseCase: AuthenticateUserUseCase;

let connection: Connection;
const request = supertest(app);

describe('User Profile Test Case', () => {
    beforeAll(async () => {
        connection = await createConnection();
        await connection.runMigrations();

        usersRepository = new UsersRepository();
        createUserUseCase = new CreateUserUseCase(usersRepository);
        authenticateUserUseCase = new AuthenticateUserUseCase(usersRepository);
        
        user = await createUserUseCase.execute({
            name: 'Fulano da Silva',
            email: 'fulano@gmail.com',
            password: '1234',
        });

        const authentication = await authenticateUserUseCase.execute({
            email: 'fulano@gmail.com',
            password: '1234',
        });

        token = authentication.token;
    });

    afterAll(async () => {
        await connection.dropDatabase();
        await connection.close();
    });

    it('should be able to see an user profile', async () => {
        const { body } = await request
            .get('/api/v1/profile')
            .set({
                'Authorization': `Bearer ${token}`,
            })
            .expect(200);
        
        expect(body).toHaveProperty('name');
    });

    it('should not be able to see a non existing user', async () => {
        await request
            .get('/api/v1/profile')
            .set({
                'Authorization': `Bearer ${user.name}`,
            })
            .expect(401);
    });
});