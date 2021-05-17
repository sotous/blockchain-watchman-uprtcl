import { EthersService } from '../ethereum/ethers.service';

export const getRoutes = async () => {
  const ethService = new EthersService();
  await ethService.connect();

  return [];
};
