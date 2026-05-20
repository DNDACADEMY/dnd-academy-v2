import { useFormStatus } from 'react-dom';

import { Button, ButtonProps } from '@dnd-academy/ui';

type Props = ButtonProps;

function SubmitButton({ children, ...rest }: Props) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} {...rest}>{children}</Button>
  );
}

export default SubmitButton;
