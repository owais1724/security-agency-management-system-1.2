import { Test, TestingModule } from '@nestjs/testing';
import { DesignationsController } from './designations.controller';

describe('DesignationsController', () => {
  let controller: DesignationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DesignationsController],
    }).compile();

    controller = module.get<DesignationsController>(DesignationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
