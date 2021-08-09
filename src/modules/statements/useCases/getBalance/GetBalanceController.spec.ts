import supertest from 'supertest';
import { Connection, createConnection } from 'typeorm';

import { app } from '../../../../app';
import { User } from '../../../users/entities/User';
import { Statement } from '../../entities/Statement';
import { UsersRepository } from '../../../users/repositories/UsersRepository';
import { StatementsRepository } from '../../repositories/StatementsRepository';
import { IUsersRepository } from '../../../users/repositories/IUsersRepository';
import { IStatementsRepository } from '../../repositories/IStatementsRepository';
import { CreateStatementUseCase } from '../createStatement/CreateStatementUseCase';
import { CreateUserUseCase } from '../../../users/useCases/createUser/CreateUserUseCase';
import { AuthenticateUserUseCase } from '../../../users/useCases/authenticateUser/AuthenticateUserUseCase';

let user: User;
let token: string;
let balance: number;
let statements: Statement[];
let usersRepository: IUsersRepository;
let statementsRepository: IStatementsRepository;
let createUserUseCase: CreateUserUseCase;
let authenticateUserUseCase: AuthenticateUserUseCase;
let createStatementUseCase: CreateStatementUseCase;

let connection: Connection;
const request = supertest(app);

enum OperationType {
    DEPOSIT = 'deposit',
    WITHDRAW = 'withdraw',
}

describe('User Balance Test Case', () => {
    beforeAll(async () => {
        connection = await createConnection();
        await connection.runMigrations();

        usersRepository = new UsersRepository();
        createUserUseCase = new CreateUserUseCase(usersRepository);
        authenticateUserUseCase = new AuthenticateUserUseCase(usersRepository);
        
        statementsRepository = new StatementsRepository();
        createStatementUseCase = new CreateStatementUseCase(usersRepository, statementsRepository);

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

        statements = [
            await createStatementUseCase.execute({
                user_id: user.id as string,
                type: 'deposit' as OperationType,
                amount: 100.0,
                description: 'Depósito'
            }),

            await createStatementUseCase.execute({
                user_id: user.id as string,
                type: 'withdraw' as OperationType,
                amount: 50.0,
                description: 'Saque'
            })
        ];

        balance = 100.0 - 50.0;
    });

    afterAll(async () => {
        await connection.dropDatabase();
        await connection.close();
    });

    it('should be able to see the user balance', async () => {
        const { body } = await request
            .get('/api/v1/statements/balance')
            .set({
                'Authorization': `Bearer ${token}`,
            })
            .expect(200);
            
        expect(body).toHaveProperty('balance');
        expect(body.balance).toEqual(balance);

        expect(body).toHaveProperty('statement');
        expect(body.statement.length).toEqual(statements.length);
    });
});