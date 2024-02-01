function ProjectPage({ params }: { params: { id: number; } }) {
  return (
    <div>{`Project ${params.id}`}</div>
  );
}

export default ProjectPage;
