import Text from "@/components/common/text";

interface Props {
  title: string;
  desc?: string;
}

function PageTitle({ title, desc }: Props) {
  return (
    <div>
      <Text size="xxl" weight="bold" color={"primary"}>
        {title}
      </Text>
      <Text className="text-muted-foreground mt-2 pl-2">{desc}</Text>
    </div>
  );
}

export default PageTitle;
