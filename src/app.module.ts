import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimeOffModule } from './modules/time-off/time-off.module';
import { SyncModule } from './modules/sync/sync.module';
import { HcmMockModule } from './modules/hcm-mock/hcm-mock.module';
import { join } from 'path';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      // Path where the auto-generated schema will be saved
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      // Disabling old playground to use the modern Apollo Sandbox
      playground: false,
      csrfPrevention: false,
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'data/db.sqlite',
      // This is the only safe way now:
      // It will only load entities that YOU explicitly registered
      // in your modules via TypeOrmModule.forFeature([...])
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      // entities: [TimeOffBalance, TimeOffRequest],
      // autoLoadEntities: true,
      synchronize: true,
      logging: true,
    }),
    TimeOffModule,
    SyncModule,
    HcmMockModule,
  ],
})
export class AppModule {}
