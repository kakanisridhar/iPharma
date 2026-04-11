import Text from "@/components/common/text";

interface Props {
  code: string | number;
  description: string;
}

export function Error({ code, description }: Props) {
  return (
    <div className="flex flex-row min-h-screen justify-center items-center">
      <div className="flex flex-col items-center w-[300px] text-center">
        <h1 className="text-8xl">{code}</h1>
        <Text className="text-muted-foreground">{description}</Text>
      </div>
    </div>
  );
}
