import MainLayout from './layouts/MainLayout';
import HeroSection from './sections/HeroSection';
import SkillsSection from './sections/SkillsSection';
import ExperienceSection from './sections/ExperienceSection';
import ProjectsSection from './sections/ProjectsSection';
import ContactSection from './sections/ContactSection';

export default function App() {
  return (
    <MainLayout>
      <HeroSection />
      <SkillsSection />
      <ExperienceSection />
      <ProjectsSection />
      <ContactSection />
    </MainLayout>
  );
}