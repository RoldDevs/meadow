import { Appbar, useTheme } from 'react-native-paper';

export default function TopAppBar({
  onBack = null,
  title = "headrTitle",
  rightButtons = null
}) {
  const theme = useTheme();

  return (
    <Appbar.Header>
      {onBack && (
        <Appbar.BackAction 
          onPress={onBack} 
          iconColor="#FFFFFF"
        />
      )}
      <Appbar.Content title={title} titleStyle={{ color: '#FFFFFF' }} />
      {(Array.isArray(rightButtons) && rightButtons.length > 0) && rightButtons.map((item,index) => (
        <Appbar.Action
          key={index}
          icon={item.icon}
          onPress={item.action}
          iconColor={item.iconColor || theme.colors.onSurface}
          disabled={item.disabled}
        />
      ))}
    </Appbar.Header>
  );
}
