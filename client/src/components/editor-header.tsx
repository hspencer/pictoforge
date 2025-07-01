import TopBar from './top-bar';

interface EditorHeaderProps {
  title?: string;
  instanceName?: string;
}

export default function EditorHeader({ title = "Editor", instanceName = "Aotearoa" }: EditorHeaderProps) {
  return (
    <TopBar 
      variant="editor" 
      title={title}
      subtitle={`Instancia: ${instanceName}`}
      backLink={`/place/${instanceName.toLowerCase()}`}
      showAuth={false}
    />
  );
}