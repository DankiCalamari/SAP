import React from 'react';
import { Card, CardContent, Typography, Box, SvgIconProps } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactElement<SvgIconProps>;
  trend?: {
    direction: 'up' | 'down';
    value: number;
  };
  color: string;
  onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color,
  onClick,
}) => {
  return (
    <Card
      sx={{
        background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
        color: 'white',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s',
        '&:hover': onClick
          ? {
              transform: 'translateY(-4px)',
              boxShadow: 4,
            }
          : {},
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box>{React.cloneElement(icon, { sx: { fontSize: 40, opacity: 0.9 } })}</Box>
          {trend && (
            <Box display="flex" alignItems="center" gap={0.5}>
              {trend.direction === 'up' ? (
                <TrendingUp sx={{ fontSize: 20 }} />
              ) : (
                <TrendingDown sx={{ fontSize: 20 }} />
              )}
              <Typography variant="body2" fontWeight="600">
                {trend.value}%
              </Typography>
            </Box>
          )}
        </Box>

        <Typography variant="h4" fontWeight="bold" mb={0.5}>
          {value}
        </Typography>

        <Typography variant="body2" sx={{ opacity: 0.9, mb: subtitle ? 0.5 : 0 }}>
          {title}
        </Typography>

        {subtitle && (
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricCard;
