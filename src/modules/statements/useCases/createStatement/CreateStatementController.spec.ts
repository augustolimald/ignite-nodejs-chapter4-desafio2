import supertest from 'supertest';
import { Connection, createConnection } from 'typeorm';

import { app } from '../../../../app';
import { User } from '../../../users/entities/User';
import { UsersRepository } from '../../../users/repositories/UsersRepository';
import { IUsersRepository } from '../../../users/repositories/IUsersRepository';
import { CreateUserUseCase } from '../../../users/useCases/createUser/CreateUserUseCase';
import { AuthenticateUserUseCase } from '../../../users/useCases/authenticateUser/AuthenticateUserUseCase';

let user: User;
let token: string;
let balance: number;
let usersRepository: IUsersRepository;
let createUserUseCase: CreateUserUseCase;
let authenticateUserUseCase: AuthenticateUserUseCase;

let connection: Connection;
const request = supertest(app);

describe('Create Statement Test Case', () => {
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

    it('should be able to add a deposit', async () => {
        await request
            .post('/api/v1/statements/deposit')
            .send({
                amount: 100.0,
                description: 'Depósito',
            })
            .set({
                'Authorization': `Bearer ${token}`,
            })
            .expect(201);
        
        balance += 100.0;
    });

    it('should be able to add a withdraw with funds', async () => {
        await request
            .post('/api/v1/statements/withdraw')
            .send({
                amount: 50.0,
                description: 'Saque',
            })
            .set({
                'Authorization': `Bearer ${token}`,
            })
            .expect(201);
        
        balance -= 50.0;
    });

    it('should be able to add a withdraw without funds', async () => {
        await request
            .post('/api/v1/statements/withdraw')
            .send({
                amount: balance * 2,
                description: 'Saque',
            })
            .set({
                'Authorization': `Bearer ${token}`,
            })
            .expect(500);
    });
});