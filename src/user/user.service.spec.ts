import { Repository } from "typeorm";
import { UserService } from "./user.service";
import { User } from "./entities/user.entity";
import { Role } from "../common/enums/rol.enum";
import { TokenService } from "../auth/token.service";
import { BadRequestException } from "@nestjs/common";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Test, TestingModule } from "@nestjs/testing";
import { UpdateUserDto } from "./dto/update-user.dto";

describe("UserService", () => {
  let userService: UserService;
  let userRepository: Repository<User>;

  const mookUser = {
    id: 1,
    name: "test",
    email: "test@test.com",
    password: "password",
    roles: [Role.USER],
    deletedAt: null,
  }

  const mockTokenService = {

  };

  const mockUserRepository = {
    save: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    findOneById: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: TokenService,
          useValue: mockTokenService,
        },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it("should be defined", () => {
    expect(userService).toBeDefined();
  });

  describe("create", () => {
    it("should create a user", async () => {
        const createUserDto = { email: mookUser.email, password: mookUser.password };

        mockUserRepository.findOneBy.mockResolvedValue(null);
        mockUserRepository.save.mockResolvedValue(createUserDto);

        const result = await userService.create(createUserDto);

        expect(result).toEqual(createUserDto);
        expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ email: createUserDto.email });
        expect(mockUserRepository.save).toHaveBeenCalledWith(createUserDto);
    });

    it("should throw a BadRequestException if email is not unique", async () => {
        const createUserDto = { email: mookUser.email, password: mookUser.password };

        mockUserRepository.findOneBy.mockResolvedValue(mookUser);

        await expect(userService.create(createUserDto)).rejects.toThrow(BadRequestException);
        expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ email: createUserDto.email });
    });
  });

  describe("findOne", () => {
    it("should find and return a user by ID", async () => {
      jest.spyOn(userRepository, "findOneBy").mockResolvedValue(mookUser);
  
      const result = await userService.findOne(mookUser.id);
  
      expect(result).toEqual(mookUser);
      expect(userRepository.findOneBy).toHaveBeenCalledWith({ id: mookUser.id });
    });

    it("should throw BadRequestException if invalid ID is provided", async () => {
      const id = -1;

      mockUserRepository.findOneBy.mockResolvedValue(null);
      
      await expect(userService.findOne(id)).rejects.toThrow(
        BadRequestException
      );

      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ id });
    });
  });

  describe("profile", () => {
    it("should find and return a user by email", async () => {
      jest.spyOn(userRepository, "findOneBy").mockResolvedValue(mookUser);
  
      const result = await userService.profile(mookUser.email);
  
      expect(result).toEqual(mookUser);
      expect(userRepository.findOneBy).toHaveBeenCalledWith({ email: mookUser.email });
    });

    it("should throw BadRequestException if unexisted email is provided", async () => {
      const email = "fake_test@test-com";

      mockUserRepository.findOneBy.mockResolvedValue(null);
      
      await expect(userService.profile(email)).rejects.toThrow(
        BadRequestException
      );

      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ email });
    });
  });
     
  describe("updateUser", () => {  
    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    it("should update a user successfully", async () => {
      const updateUserDto: UpdateUserDto = { email: "newemail@test.com", name: "Edited" };
      const updatedUser = { ...mookUser, ...updateUserDto };

      mockUserRepository.findOneBy
        .mockResolvedValueOnce(mookUser)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(updatedUser);

      const result = await userService.updateUser(mookUser.id, updateUserDto);
  
      expect(result).toEqual(userService.toUserResponse(updatedUser));
      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ id: mookUser.id });
      expect(mockUserRepository.update).toHaveBeenCalledWith(mookUser.id, updateUserDto);
    });

    it("should throw BadRequestException if user ID does not exist", async () => {
      mockUserRepository.findOneBy.mockResolvedValue(null);
  
      const updateUserDto: UpdateUserDto = { email: "newemail@test.com" };
  
      await expect(userService.updateUser(999, updateUserDto)).rejects.toThrow(BadRequestException);
      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ id: 999 });
    });
  
    it("should throw BadRequestException if email is not unique", async () => {
      const updateUserDto: UpdateUserDto = { email: "existingemail@test.com" };

      mockUserRepository.findOneBy
        .mockResolvedValueOnce(mookUser)
        .mockResolvedValueOnce({ ...mookUser, id: 2, email: updateUserDto.email });

      await expect(userService.updateUser(mookUser.id, updateUserDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockUserRepository.findOneBy).toHaveBeenNthCalledWith(1, { id: mookUser.id });
      expect(mockUserRepository.findOneBy).toHaveBeenNthCalledWith(2, { email: updateUserDto.email });
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });
  });  

  describe("removeUser", () => {
    it("should delete a user successfully", async () => {
      const userId = mookUser.id;

      mockUserRepository.findOneBy.mockResolvedValueOnce(mookUser);

      mockUserRepository.softDelete.mockResolvedValueOnce({ affected: 1 });

      const result = await userService.removeUser(userId);

      expect(result).toEqual({ message: 'User successfully deleted' });
      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ id: userId });
      expect(mockUserRepository.softDelete).toHaveBeenCalledWith({ id: userId });
    });
  
    it("should throw a BadRequestException if user does not exist", async () => {
      const invalidUserId = 999;

      mockUserRepository.findOneBy.mockResolvedValueOnce(null);

      await expect(userService.removeUser(invalidUserId)).rejects.toThrow(BadRequestException);

      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ id: invalidUserId });
    });
  });
  
  describe("toUserResponse", () => {
    it("should return a user with a type UserResponse", () => {
      const result = userService.toUserResponse(mookUser);
      const expectedResponse = {
        id: 1,
        name: "test",
        email: "test@test.com",
        roles: [Role.USER],
      }

      expect(result).toEqual(expectedResponse);
    })
  });
});
