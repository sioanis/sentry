import Cookies from 'js-cookie';

import {render, screen} from 'sentry-test/reactTestingLibrary';

import {Role} from 'sentry/components/acl/role';
import ConfigStore from 'sentry/stores/configStore';

describe('Role', function () {
  const organization = TestStubs.Organization({
    role: 'admin',
    availableRoles: [
      {
        id: 'member',
        name: 'Member',
      },
      {
        id: 'admin',
        name: 'Admin',
      },
      {
        id: 'manager',
        name: 'Manager',
      },
      {
        id: 'owner',
        name: 'Owner',
      },
    ],
  });
  const routerContext = TestStubs.routerContext([
    {
      organization,
    },
  ]);

  describe('as render prop', function () {
    const childrenMock = jest.fn().mockReturnValue(null);
    beforeEach(function () {
      childrenMock.mockClear();
    });

    it('has a sufficient role', function () {
      render(<Role role="admin">{childrenMock}</Role>, {context: routerContext});

      expect(childrenMock).toHaveBeenCalledWith({
        hasRole: true,
      });
    });

    it('has an unsufficient role', function () {
      render(<Role role="manager">{childrenMock}</Role>, {
        context: routerContext,
      });

      expect(childrenMock).toHaveBeenCalledWith({
        hasRole: false,
      });
    });

    it('gives access to a superuser with unsufficient role', function () {
      ConfigStore.config.user = {isSuperuser: true};
      Cookies.set = jest.fn();

      render(<Role role="owner">{childrenMock}</Role>, {context: routerContext});

      expect(childrenMock).toHaveBeenCalledWith({
        hasRole: true,
      });
      expect(Cookies.set).toHaveBeenCalledWith('su', 'test');
      ConfigStore.config.user = {isSuperuser: false};
    });

    it('does not give access to a made up role', function () {
      render(<Role role="abcdefg">{childrenMock}</Role>, {
        context: routerContext,
      });

      expect(childrenMock).toHaveBeenCalledWith({
        hasRole: false,
      });
    });

    it('handles no user', function () {
      const user = {...ConfigStore.config.user};
      ConfigStore.config.user = undefined;
      render(<Role role="member">{childrenMock}</Role>, {context: routerContext});

      expect(childrenMock).toHaveBeenCalledWith({
        hasRole: false,
      });
      ConfigStore.config.user = user;
    });

    it('updates if user changes', function () {
      const user = {...ConfigStore.config.user};
      ConfigStore.config.user = undefined;
      const {rerender} = render(<Role role="member">{childrenMock}</Role>, {
        context: routerContext,
      });

      expect(childrenMock).toHaveBeenCalledWith({
        hasRole: false,
      });
      ConfigStore.config.user = user;

      rerender(<Role role="member">{childrenMock}</Role>);
      expect(childrenMock).toHaveBeenCalledWith({
        hasRole: true,
      });
    });

    it('handles no availableRoles', function () {
      render(
        <Role role="member" organization={{...organization, availableRoles: undefined}}>
          {childrenMock}
        </Role>,
        {context: routerContext}
      );

      expect(childrenMock).toHaveBeenCalledWith({
        hasRole: false,
      });
    });
  });

  describe('as React node', function () {
    it('has a sufficient role', function () {
      render(
        <Role role="member">
          <div>The Child</div>
        </Role>,
        {context: routerContext}
      );

      expect(screen.getByText('The Child')).toBeInTheDocument();
    });

    it('has an unsufficient role', function () {
      render(
        <Role role="owner">
          <div>The Child</div>
        </Role>,
        {context: routerContext}
      );

      expect(screen.queryByText('The Child')).not.toBeInTheDocument();
    });
  });
});
