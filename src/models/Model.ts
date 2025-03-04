import { ObservableReactionContainer } from '../core/ObservableReactionContainer';
import { nanoid } from 'nanoid';

export abstract class Model extends ObservableReactionContainer {
  protected id = nanoid(10);
}
