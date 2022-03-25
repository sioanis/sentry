import Reflux from 'reflux';

import EnvironmentActions from 'sentry/actions/environmentActions';
import {Environment} from 'sentry/types';
import {getDisplayName, getUrlRoutingName} from 'sentry/utils/environment';

import {makeSafeRefluxStore} from '../utils/makeSafeRefluxStore';

type EnhancedEnvironment = Environment & {
  displayName: string;
  urlRoutingName: string;
};

type State = {
  environments: EnhancedEnvironment[] | null;
  error: Error | null;
};

type OrganizationEnvironmentsStoreInterface = {
  get(): State;
  init(): void;
  onFetchEnvironments(): void;
  onFetchEnvironmentsError(error: Error): void;
  onFetchEnvironmentsSuccess(environments: Environment[]): void;
  state: State;
};

const storeConfig: Reflux.StoreDefinition & OrganizationEnvironmentsStoreInterface = {
  state: {
    environments: null,
    error: null,
  },

  init() {
    this.state = {environments: null, error: null};

    this.listenTo(EnvironmentActions.fetchEnvironments, this.onFetchEnvironments);
    this.listenTo(
      EnvironmentActions.fetchEnvironmentsSuccess,
      this.onFetchEnvironmentsSuccess
    );
    this.listenTo(
      EnvironmentActions.fetchEnvironmentsError,
      this.onFetchEnvironmentsError
    );
  },

  makeEnvironment(item: Environment): EnhancedEnvironment {
    return {
      id: item.id,
      name: item.name,
      get displayName() {
        return getDisplayName(item);
      },
      get urlRoutingName() {
        return getUrlRoutingName(item);
      },
    };
  },

  onFetchEnvironments() {
    this.state = {environments: null, error: null};
    this.trigger(this.state);
  },

  onFetchEnvironmentsSuccess(environments) {
    this.state = {error: null, environments: environments.map(this.makeEnvironment)};
    this.trigger(this.state);
  },

  onFetchEnvironmentsError(error) {
    this.state = {error, environments: null};
    this.trigger(this.state);
  },

  get() {
    return this.state;
  },
};

const OrganizationEnvironmentsStore = makeSafeRefluxStore(
  Reflux.createStore(storeConfig) as Reflux.Store & OrganizationEnvironmentsStoreInterface
);

export default OrganizationEnvironmentsStore;
