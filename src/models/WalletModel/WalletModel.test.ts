import { DependencyService } from '../../services/injection/DependencyContext';
import { WalletModel } from './WalletModel';
import { PublicKey } from '@solana/web3.js';
import { Adapter } from '@solana/wallet-adapter-base';
import {
  TestWalletAdaptor,
  TestWalletAdaptorName,
  TestWalletAdaptorService,
} from '../../__test__/TestWalletAdaptor';
import { awaitReaction, delayedAction } from '../../core/ObservableReactionContainer';
import { publicKey } from '@solana/web3.js/src/layout';

describe('WalletModel should work as expected', function () {
  beforeAll(() => {
    TestWalletAdaptorService.SetTestAdaptorList();
  });
  afterAll(() => {
    TestWalletAdaptorService.RestoreWalletAdaptorList();
  });

  beforeEach(() => {
    const walletModel = DependencyService.resolve<WalletModel>(WalletModel);
    walletModel.initialize();
  });
  afterEach(() => {
    const walletModel = DependencyService.resolve<WalletModel>(WalletModel);
    walletModel.end();
  });

  it('WalletModel should be set up wallet adaptor(s) correctly', async () => {
    const walletModel = DependencyService.resolve<WalletModel>(WalletModel);
    expect(walletModel, 'Wallet Model should exist').toBeTruthy();
    expect(walletModel.adaptors, 'wallet should have adaptors').toBeTruthy();
    expect(
      walletModel.adaptors.length,
      'wallet should have more than 0 adaptors'
    ).toBeGreaterThanOrEqual(1);
    const walletAdaptor = walletModel.adaptors[0];
    expect(walletAdaptor, 'wallet adaptor should exist').toBeTruthy();
    expect(
      walletAdaptor instanceof TestWalletAdaptor,
      'Should be a test wallet adaptor'
    ).toBeTruthy();
    expect(walletAdaptor.name, 'should have test adaptor').toEqual(TestWalletAdaptorName);
  });

  it('WalletModel should respond to changes in the wallet adaptor connected state', async () => {
    const walletModel = DependencyService.resolve<WalletModel>(WalletModel);
    const walletAdaptor = TestWalletAdaptorService.GetTestWalletAdaptor();
    expect(walletModel.connected, 'Wallet Model and Wallet Adaptor should be the same').toEqual(
      walletAdaptor.connected
    );
    expect(walletAdaptor.connected, 'Wallet Adaptor should not be connected').toBeFalsy();

    walletAdaptor.connect();
    expect(walletAdaptor.connecting, 'wallet adaptor should be connecting').toBeTruthy();
    const isConnected = await awaitReaction(
      () => walletModel.connected,
      (val) => val
    );
    expect(isConnected, 'we should have connected correctly').toBeTruthy();
    expect(walletModel.connected, 'Wallet Model should reflect being connected').toBeTruthy();
    expect(walletAdaptor.connected, 'Wallet Adaptor should be connected').toBeTruthy();
    expect(walletAdaptor.connecting, 'Wallet Adaptor should not be connecting anymore').toBeFalsy();

    expect(
      walletAdaptor.publicKey?.toBase58(),
      'Wallet Adaptor PubKey should be the same as the wallet model'
    ).toEqual(walletModel.publicKey);

    walletAdaptor.disconnect();

    const isDisconnected = await awaitReaction(
      () => walletModel.connected,
      (val) => val
    );
    expect(isDisconnected, 'Wallet Model should be disconnected').toBeFalsy();
    expect(walletModel.connected, 'Wallet Model should reflect being disconnected').toBeFalsy();
    expect(walletAdaptor.connected, 'Wallet Adaptor should be disconnected').toBeFalsy();
    expect(walletModel.publicKey.length, 'Wallet Model Public key should be empty').toEqual(0);
  }, 50000);
});
