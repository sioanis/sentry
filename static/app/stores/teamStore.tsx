import Reflux from 'reflux';

import TeamActions from 'sentry/actions/teamActions';
import {Team} from 'sentry/types';
import {defined} from 'sentry/utils';
import {makeSafeRefluxStore} from 'sentry/utils/makeSafeRefluxStore';

import {CommonStoreInterface} from './types';

type State = {
  cursor: string | null;
  hasMore: boolean | null;
  loadedUserTeams: boolean;
  loading: boolean;
  teams: Team[];
};

type TeamStoreInterface = CommonStoreInterface<State> & {
  getAll(): Team[];
  getById(id: string): Team | null;
  getBySlug(slug: string): Team | null;
  init(): void;
  initialized: boolean;
  loadInitialData(items: Team[], hasMore?: boolean | null, cursor?: string | null): void;
  onCreateSuccess(team: Team): void;
  onRemoveSuccess(slug: string): void;
  onUpdateSuccess(itemId: string, response: Team): void;
  reset(): void;
  safeListenTo(action: Reflux.ActionsDefinition, callback: (...data: any) => void);

  state: State;
  teardown(): void;
  unsubscribeListeners: (() => void)[];
};

const teamStoreConfig: Reflux.StoreDefinition & TeamStoreInterface = {
  unsubscribeListeners: [],
  initialized: false,
  state: {
    teams: [],
    loadedUserTeams: false,
    loading: true,
    hasMore: null,
    cursor: null,
  },

  init() {
    this.reset();

    this.safeListenTo(TeamActions.createTeamSuccess, this.onCreateSuccess);
    this.safeListenTo(TeamActions.fetchDetailsSuccess, this.onUpdateSuccess);
    this.safeListenTo(TeamActions.loadTeams, this.loadInitialData);
    this.safeListenTo(TeamActions.loadUserTeams, this.loadUserTeams);
    this.safeListenTo(TeamActions.removeTeamSuccess, this.onRemoveSuccess);
    this.safeListenTo(TeamActions.updateSuccess, this.onUpdateSuccess);
  },

  safeListenTo(action, callback) {
    this.unsubscribeListeners.push(this.listenTo(action), callback);
  },

  teardown() {
    while (this.unsubscribeListeners.length > 0) {
      const unsubscribeListener = this.unsubscribeListeners.pop();

      if (typeof unsubscribeListener !== 'function') {
        throw new Error(
          `Attempting to call ${JSON.stringify(
            unsubscribeListener
          )}. A falsy unsubscribe listener was stored, unsubscribe listeners should only include function calls`
        );
      }
      unsubscribeListener();
    }
  },

  reset() {
    this.state = {
      teams: [],
      loadedUserTeams: false,
      loading: true,
      hasMore: null,
      cursor: null,
    };
  },

  loadInitialData(items, hasMore, cursor) {
    this.initialized = true;
    this.state = {
      teams: items.sort((a, b) => a.slug.localeCompare(b.slug)),
      loadedUserTeams: defined(hasMore) ? !hasMore : this.state.loadedUserTeams,
      loading: false,
      hasMore: hasMore ?? this.state.hasMore,
      cursor: cursor ?? this.state.cursor,
    };
    this.trigger(new Set(items.map(item => item.id)));
  },

  loadUserTeams(userTeams: Team[]) {
    const teamIdMap = this.state.teams.reduce((acc: Record<string, Team>, team: Team) => {
      acc[team.id] = team;
      return acc;
    }, {});

    // Replace or insert new user teams
    userTeams.reduce((acc: Record<string, Team>, userTeam: Team) => {
      acc[userTeam.id] = userTeam;
      return acc;
    }, teamIdMap);

    const teams = Object.values(teamIdMap).sort((a, b) => a.slug.localeCompare(b.slug));
    this.state = {
      ...this.state,
      loadedUserTeams: true,
      teams,
    };

    this.trigger(new Set(Object.keys(teamIdMap)));
  },

  onUpdateSuccess(itemId, response) {
    if (!response) {
      return;
    }

    const item = this.getBySlug(itemId);

    if (!item) {
      this.state = {
        ...this.state,
        teams: [...this.state.teams, response],
      };

      this.trigger(new Set([itemId]));
      return;
    }

    // Slug was changed
    // Note: This is the proper way to handle slug changes but unfortunately not all of our
    // components use stores correctly. To be safe reload browser :((
    if (response.slug !== itemId) {
      // Replace the team
      const teams = [...this.state.teams.filter(({slug}) => slug !== itemId), response];

      this.state = {...this.state, teams};
      this.trigger(new Set([response.slug]));
      return;
    }

    const newTeams = [...this.state.teams];
    const index = newTeams.findIndex(team => team.slug === response.slug);
    newTeams[index] = response;

    this.state = {...this.state, teams: newTeams};
    this.trigger(new Set([itemId]));
  },

  onRemoveSuccess(slug: string) {
    const {teams} = this.state;
    this.loadInitialData(teams.filter(team => team.slug !== slug));
  },

  onCreateSuccess(team: Team) {
    this.loadInitialData([...this.state.teams, team]);
  },

  getState() {
    return this.state;
  },

  getById(id: string) {
    const {teams} = this.state;
    return teams.find(item => item.id.toString() === id.toString()) || null;
  },

  getBySlug(slug: string) {
    const {teams} = this.state;
    return teams.find(item => item.slug === slug) || null;
  },

  getAll() {
    return this.state.teams;
  },
};

const TeamStore = makeSafeRefluxStore(
  Reflux.createStore(teamStoreConfig) as Reflux.Store & TeamStoreInterface
);

export default TeamStore;
