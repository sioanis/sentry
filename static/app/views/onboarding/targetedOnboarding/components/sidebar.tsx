import styled from '@emotion/styled';
import {motion, Variants} from 'framer-motion';
import {PlatformIcon} from 'platformicons';

import platforms from 'sentry/data/platforms';
import {t} from 'sentry/locale';
import pulsingIndicatorStyles from 'sentry/styles/pulsingIndicator';
import space from 'sentry/styles/space';
import {Project} from 'sentry/types';
import testableTransition from 'sentry/utils/testableTransition';
import withProjects from 'sentry/utils/withProjects';

type Props = {
  projects: Project[];
  setNewProject: (newProjectId: string) => void;
  activeProject?: Project;
};
function Sidebar({projects, activeProject, setNewProject}: Props) {
  const oneProject = (project: Project) => {
    const name = platforms.find(p => p.id === project.platform)?.name ?? '';
    const isActive = activeProject?.id === project.id;
    return (
      <ProjectWrapper
        key={project.id}
        isActive={isActive}
        onClick={() => setNewProject(project.id)}
      >
        <IconWrapper>
          <PlatformIcon platform={project.platform || 'other'} size={23} />
        </IconWrapper>
        <MiddleWrapper>
          {name}
          <SubHeader>{t('Waiting for error')}</SubHeader>
        </MiddleWrapper>
        <IconWrapper>{isActive && <WaitingIndicator />}</IconWrapper>
      </ProjectWrapper>
    );
  };
  return (
    <div>
      <Title>{t('Projects to Setup')}</Title>
      {projects.map(oneProject)}
    </div>
  );
}

export default withProjects(Sidebar);

const Title = styled('span')`
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
`;

const ProjectWrapper = styled('div')<{isActive: boolean}>`
  display: grid;
  grid-template-columns: 1fr fit-content(100%) 1fr;
  background-color: ${p => p.isActive && p.theme.surface100};
  padding: ${space(2)} ${space(2)} ${space(2)} 0;
  cursor: pointer;
`;

const SubHeader = styled('div')`
  color: ${p => p.theme.charts.getColorPalette(5)[4]};
`;

const indicatorAnimation: Variants = {
  initial: {opacity: 0, y: -10},
  animate: {opacity: 1, y: 0},
  exit: {opacity: 0, y: 10},
};

const WaitingIndicator = styled(motion.div)`
  margin: 0 6px;
  ${pulsingIndicatorStyles};
  background-color: ${p => p.theme.charts.getColorPalette(5)[4]};
`;

WaitingIndicator.defaultProps = {
  variants: indicatorAnimation,
  transition: testableTransition(),
};

const IconWrapper = styled('div')`
  margin: auto;
`;

const MiddleWrapper = styled('div')`
  margin: 0 ${space(1)};
`;
