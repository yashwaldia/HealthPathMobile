// components/fitcalc/FitCalcChart.tsx


import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { Colors } from '../../constants/colors';
import {
  ActivityInputs, ActivityResult, BmiInputs, BmiResult, BmrResult,
  BodyFatInputs, BodyFatResult, HrZonesResult, HrvResult, IdealWeightInputs,
  IdealWeightResult, MacrosResult, OneRmResult, ProteinInputs,
  ProteinResult, RatiosResult, RecoveryResult, RunningResult,
  SleepGraphResult,
  SleepQualityResult, // ✅ ADD THIS
  StressResult, TdeeInputs, TdeeResult, Vo2maxResult, WaterResult,
} from '../../types/fitcalc';



type ChartProps =
  | { type: 'bmi'; data: BmiResult; inputs?: BmiInputs }
  | { type: 'bmr'; data: BmrResult }
  | { type: 'tdee'; data: TdeeResult; inputs?: TdeeInputs }
  | { type: 'macros'; data: MacrosResult }
  | { type: 'onerm'; data: OneRmResult }
  | { type: 'bodyfat'; data: BodyFatResult; inputs?: BodyFatInputs }
  | { type: 'idealweight'; data: IdealWeightResult; inputs?: IdealWeightInputs }
  | { type: 'hrzones'; data: HrZonesResult }
  | { type: 'vo2max'; data: Vo2maxResult }
  | { type: 'activity'; data: ActivityResult; inputs?: ActivityInputs }
  | { type: 'ratios'; data: RatiosResult }
  | { type: 'water'; data: WaterResult }
  | { type: 'running'; data: RunningResult }
  | { type: 'protein'; data: ProteinResult; inputs?: ProteinInputs }
  | { type: 'hrv'; data: HrvResult }
  | { type: 'recovery'; data: RecoveryResult }
  | { type: 'sleepquality'; data: SleepQualityResult }
  | { type: 'sleepgraph'; data: SleepGraphResult } // ✅ ADD THIS
  | { type: 'stress'; data: StressResult };


type MarkingItem = { label: string; value: string };


const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - 105;
const CHART_CONFIG = {
  backgroundColor: Colors.light.cardBackground,
  backgroundGradientFrom: Colors.light.cardBackground,
  backgroundGradientTo: Colors.light.cardBackground,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(67, 97, 238, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
  style: { borderRadius: 12 },
  propsForBackgroundLines: { strokeDasharray: '', stroke: Colors.light.border, strokeWidth: 1 },
  propsForLabels: { fontSize: 9, fontWeight: '600' as const },
};


const COLORS = {
  primary: '#4361EE', success: '#55EFC4', warning: '#FFEAA7',
  danger: '#FF7675', info: '#4CC9F0', purple: '#3A0CA3',
  orange: '#FAB1A0', green: '#00B894', lightBlue: '#74B9FF',
};


const MealMarkingGrid: React.FC<{ items: MarkingItem[] }> = ({ items }) => {
  const renderItem = (item: MarkingItem, idx: number) => (
    <View key={idx} style={s.markingItem}>
      <Text style={s.markingLabel}>{item.label}</Text>
      <Text style={s.markingValue}>{item.value}</Text>
    </View>
  );


  if (items.length === 1) return <View style={s.markingGrid}><View style={s.rowCenter}>{renderItem(items[0], 0)}</View></View>;
  if (items.length === 2) return <View style={s.markingGrid}><View style={s.row}>{items.map(renderItem)}</View></View>;
  if (items.length === 3) return (
    <View style={s.markingGrid}>
      <View style={s.row}>{items.slice(0, 2).map(renderItem)}</View>
      <View style={s.rowCenter}>{renderItem(items[2], 2)}</View>
    </View>
  );
  if (items.length === 4) return (
    <View style={s.markingGrid}>
      <View style={s.row}>{items.slice(0, 2).map(renderItem)}</View>
      <View style={s.row}>{items.slice(2).map(renderItem)}</View>
    </View>
  );
  if (items.length === 5) return (
    <View style={s.markingGrid}>
      <View style={s.row}>{items.slice(0, 2).map(renderItem)}</View>
      <View style={s.row}>{items.slice(2, 4).map(renderItem)}</View>
      <View style={s.rowCenter}>{renderItem(items[4], 4)}</View>
    </View>
  );
  return <View style={s.markingGrid}><View style={s.rowWrap}>{items.map(renderItem)}</View></View>;
};


export const FitCalcChart = React.memo<ChartProps>((props) => {
  const chartComponent = useMemo(() => {
    switch (props.type) {
      case 'bmi': return <BmiChart data={props.data} />;
      case 'bmr': return <BmrChart data={props.data} />;
      case 'tdee': return <TdeeChart data={props.data} inputs={props.inputs} />;
      case 'macros': return <MacrosChart data={props.data} />;
      case 'onerm': return <OneRmChart data={props.data} />;
      case 'bodyfat': return <BodyFatChart data={props.data} inputs={props.inputs} />;
      case 'idealweight': return <IdealWeightChart data={props.data} />;
      case 'hrzones': return <HrZonesChart data={props.data} />;
      case 'vo2max': return <Vo2MaxChart data={props.data} />;
      case 'activity': return <ActivityChart data={props.data} inputs={props.inputs} />;
      case 'ratios': return <RatiosChart data={props.data} />;
      case 'water': return <WaterChart data={props.data} />;
      case 'running': return <RunningChart data={props.data} />;
      case 'protein': return <ProteinChart data={props.data} inputs={props.inputs} />;
      case 'hrv': return <HrvChart data={props.data} />;
      case 'recovery': return <RecoveryChart data={props.data} />;
      case 'sleepquality': return <SleepQualityChart data={props.data} />;
      case 'sleepgraph': return <SleepGraphChart data={props.data} />; // ✅ ADD THIS
      case 'stress': return <StressChart data={props.data} />;
      default: return null;
    }
  }, [props]);
  return <View style={s.container}>{chartComponent}</View>;
});


FitCalcChart.displayName = 'FitCalcChart';


const BmiChart: React.FC<{ data: BmiResult }> = ({ data }) => {
  const bmi = parseFloat(data.value);
  const getPos = () => {
    if (bmi < 18.5) return (bmi / 18.5) * 25;
    if (bmi < 25) return 25 + ((bmi - 18.5) / 6.5) * 25;
    if (bmi < 30) return 50 + ((bmi - 25) / 5) * 25;
    return 75 + Math.min(((bmi - 30) / 10) * 25, 25);
  };


  return (
    <View style={s.bmiCon}>
      <View style={s.bmiScale}>
        {[COLORS.info, COLORS.success, COLORS.warning, COLORS.danger].map((c, i) => (
          <View key={i} style={[s.bmiZone, { backgroundColor: c }]} />
        ))}
      </View>
      <View style={[s.bmiInd, { left: `${getPos()}%` }]}>
        <View style={s.bmiDot} />
        <Text style={s.bmiText}>{data.value}</Text>
      </View>
      <View style={s.bmiLabels}>
        {['Under', 'Normal', 'Over', 'Obese'].map((l, i) => <Text key={i} style={s.bmiLabel}>{l}</Text>)}
      </View>
      <View style={s.bmiRanges}>
        {['<18.5', '18.5-25', '25-30', '>30'].map((r, i) => <Text key={i} style={s.bmiRange}>{r}</Text>)}
      </View>
    </View>
  );
};


const BmrChart: React.FC<{ data: BmrResult }> = () => (
  <View style={s.pieCon}>
    <Text style={s.title}>Energy Expenditure Breakdown</Text>
    <View style={s.chartWrap}>
      <PieChart
        data={[
          { name: 'BMR (65%)', value: 65, color: COLORS.primary, legendFontColor: Colors.light.text, legendFontSize: 9 },
          { name: 'Activity (25%)', value: 25, color: COLORS.info, legendFontColor: Colors.light.text, legendFontSize: 9 },
          { name: 'TEF (10%)', value: 10, color: COLORS.purple, legendFontColor: Colors.light.text, legendFontSize: 9 },
        ]}
        width={CHART_WIDTH} height={90} chartConfig={CHART_CONFIG}
        accessor="value" backgroundColor="transparent" paddingLeft="0" center={[0, 0]} hasLegend
      />
    </View>
    <Text style={s.note}>TEF = Thermic Effect of Food</Text>
  </View>
);


const TdeeChart: React.FC<{ data: TdeeResult; inputs?: TdeeInputs }> = ({ data, inputs }) => {
  const mults = [1.2, 1.375, 1.55, 1.725, 1.9];
  const curr = parseFloat(inputs?.activity || '1.55');
  const chartData = {
    labels: ['Sed', 'Light', 'Mod', 'Very', 'Extr'],
    datasets: [{
      data: mults.map(m => Math.round((data.tdee / curr) * m)),
      colors: mults.map(m => () => m === curr ? COLORS.primary : COLORS.info + '40'),
    }],
  };


  return (
    <View style={s.barCon}>
      <Text style={s.title}>TDEE by Activity Level</Text>
      <View style={s.chartWrap}>
        <BarChart data={chartData} width={SCREEN_WIDTH - 110} height={160} chartConfig={CHART_CONFIG}
          fromZero showValuesOnTopOfBars withInnerLines={false} yAxisLabel="" yAxisSuffix="" />
      </View>
      <View style={s.tdeeComp}>
        <View style={s.tdeeItem}>
          <Text style={s.tdeeLabel}>Maintenance</Text>
          <Text style={s.tdeeValue}>{data.tdee} kcal</Text>
        </View>
        <View style={s.divider} />
        <View style={s.tdeeItem}>
          <Text style={s.tdeeLabel}>Your Goal</Text>
          <Text style={[s.tdeeValue, { color: COLORS.primary }]}>{data.target} kcal</Text>
        </View>
      </View>
    </View>
  );
};


const MacrosChart: React.FC<{ data: MacrosResult }> = ({ data }) => (
  <View style={s.pieCon}>
    <Text style={s.title}>Macro Distribution</Text>
    <View style={s.chartWrap}>
      <PieChart
        data={[
          { name: `Protein ${data.protein}g`, value: data.kcal.protein, color: COLORS.primary, legendFontColor: Colors.light.text, legendFontSize: 9 },
          { name: `Carbs ${data.carbs}g`, value: data.kcal.carbs, color: COLORS.orange, legendFontColor: Colors.light.text, legendFontSize: 9 },
          { name: `Fat ${data.fat}g`, value: data.kcal.fat, color: COLORS.purple, legendFontColor: Colors.light.text, legendFontSize: 9 },
        ]}
        width={CHART_WIDTH} height={90} chartConfig={CHART_CONFIG}
        accessor="value" backgroundColor="transparent" paddingLeft="0" center={[0, 0]} hasLegend
      />
    </View>
    <View style={s.macroPercents}>
      <Text style={s.macroPercent}>P: {Math.round(data.ratios.protein * 100)}%</Text>
      <Text style={s.macroPercent}>C: {Math.round(data.ratios.carbs * 100)}%</Text>
      <Text style={s.macroPercent}>F: {Math.round(data.ratios.fat * 100)}%</Text>
    </View>
  </View>
);


const OneRmChart: React.FC<{ data: OneRmResult }> = ({ data }) => {
  const percs = [100, 90, 80, 70, 60];
  const reps = ['1 rep', '2-3 reps', '4-6 reps', '8-10 reps', '12-15 reps'];
  const colors = [COLORS.danger, COLORS.orange, COLORS.warning, COLORS.info, COLORS.success];


  return (
    <View style={s.oneRmCon}>
      <Text style={s.title}>Training Zones</Text>
      {percs.map((p, i) => (
        <View key={p} style={s.oneRmRow}>
          <Text style={s.oneRmPerc}>{p}%</Text>
          <View style={s.oneRmBarCon}>
            <View style={[s.oneRmBar, { width: `${p}%`, backgroundColor: colors[i] }]} />
          </View>
          <Text style={s.oneRmWeight}>{Math.round((data.value * p) / 100)} kg</Text>
          <Text style={s.oneRmReps}>{reps[i]}</Text>
        </View>
      ))}
    </View>
  );
};


const BodyFatChart: React.FC<{ data: BodyFatResult; inputs?: BodyFatInputs }> = ({ data, inputs }) => {
  const bf = parseFloat(data.value);
  const gender = inputs?.gender || 'male';
  const ranges = gender === 'male'
    ? [
        { label: 'Essential', min: 0, max: 5, color: COLORS.danger },
        { label: 'Athletes', min: 5, max: 13, color: COLORS.primary },
        { label: 'Fitness', min: 13, max: 17, color: COLORS.success },
        { label: 'Average', min: 17, max: 24, color: COLORS.warning },
        { label: 'Obese', min: 24, max: 35, color: COLORS.orange }
      ]
    : [
        { label: 'Essential', min: 0, max: 13, color: COLORS.danger },
        { label: 'Athletes', min: 13, max: 20, color: COLORS.primary },
        { label: 'Fitness', min: 20, max: 24, color: COLORS.success },
        { label: 'Average', min: 24, max: 31, color: COLORS.warning },
        { label: 'Obese', min: 31, max: 40, color: COLORS.orange }
      ];
  
  const curr = ranges.find(r => bf >= r.min && bf < r.max) || ranges[ranges.length - 1];
  const maxBf = ranges[ranges.length - 1].max;
  
  // Calculate pointer position (percentage from bottom)
  const getPointerPosition = () => {
    return Math.min((bf / maxBf) * 100, 100);
  };


  return (
    <View style={s.bfCon}>
      <Text style={s.title}>Body Fat Category ({gender})</Text>
      
      {/* Main vertical bar container */}
      <View style={s.bfVerticalContainer}>
        
        {/* Vertical thermometer bar */}
        <View style={s.bfVerticalBar}>
          {ranges.slice().reverse().map((r, i) => {
            const active = r.label === curr?.label;
            const zoneHeight = ((r.max - r.min) / maxBf) * 100;
            
            return (
              <View
                key={r.label}
                style={[s.bfVerticalZone, {
                  height: `${zoneHeight}%`,
                  backgroundColor: r.color + (active ? 'FF' : '50'),
                  borderTopLeftRadius: i === 0 ? 8 : 0,
                  borderTopRightRadius: i === 0 ? 8 : 0,
                  borderBottomLeftRadius: i === ranges.length - 1 ? 8 : 0,
                  borderBottomRightRadius: i === ranges.length - 1 ? 8 : 0,
                }]}
              />
            );
          })}
        </View>
        
        {/* Pointer/Arrow indicator */}
        <View style={[s.bfPointer, { bottom: `${getPointerPosition()}%` }]}>
          <View style={s.bfPointerTriangle} />
          <View style={s.bfPointerLine} />
          <View style={s.bfPointerValueBox}>
            <Text style={s.bfPointerValue}>{data.value}%</Text>
          </View>
        </View>
        
        {/* Labels on the right side */}
        <View style={s.bfLabelsContainer}>
          {ranges.slice().reverse().map((r, i) => {
            const active = r.label === curr?.label;
            const zoneHeight = ((r.max - r.min) / maxBf) * 100;
            const topPosition = ranges.slice(i + 1).reverse().reduce((sum, zone) => 
              sum + ((zone.max - zone.min) / maxBf) * 100, 0
            );
            
            return (
              <View
                key={r.label}
                style={[s.bfLabelItem, {
                  height: `${zoneHeight}%`,
                  top: `${topPosition}%`,
                }]}
              >
                <Text style={[s.bfLabelText, { 
                  fontWeight: active ? '700' : '600',
                  color: active ? r.color : Colors.light.textSecondary 
                }]}>
                  {r.label}
                </Text>
                <Text style={[s.bfLabelRange, { 
                  color: active ? r.color : Colors.light.textSecondary 
                }]}>
                  {r.min > 0 ? `${r.min}-` : '<'}{r.max}%
                </Text>
              </View>
            );
          })}
        </View>
      </View>
      
      {/* Bottom indicator */}
      <View style={s.bfBottomInd}>
        <Text style={s.bfValue}>Your Body Fat: {data.value}%</Text>
        <Text style={s.bfCat}>Category: {curr?.label}</Text>
      </View>
    </View>
  );
};



const IdealWeightChart: React.FC<{ data: IdealWeightResult }> = ({ data }) => {
  const weights = [data.devine, data.robinson, data.miller];
  const min = Math.min(...weights) - 5, max = Math.max(...weights) + 5, range = max - min;
  const getPos = (w: number) => ((w - min) / range) * 100;


  return (
    <View style={s.iwCon}>
      <Text style={s.title}>Ideal Weight Estimates</Text>
      <View style={s.iwScale}>
        <View style={s.iwBar}>
          <View style={s.iwRange} />
          {[{ w: data.devine, c: COLORS.primary, l: 'D' }, { w: data.robinson, c: COLORS.info, l: 'R' },
            { w: data.miller, c: COLORS.success, l: 'M' }].map((m, i) => (
            <View key={i} style={[s.iwMarker, { left: `${getPos(m.w)}%`, backgroundColor: m.c }]}>
              <Text style={s.iwMarkerText}>{m.l}</Text>
            </View>
          ))}
        </View>
        <View style={s.iwAxisLabels}>
          <Text style={s.iwAxisLabel}>{Math.round(min)} kg</Text>
          <Text style={s.iwAxisLabel}>{Math.round(max)} kg</Text>
        </View>
      </View>
      <View style={s.iwLegend}>
        {[{ l: 'Devine', w: data.devine, c: COLORS.primary }, { l: 'Robinson', w: data.robinson, c: COLORS.info },
          { l: 'Miller', w: data.miller, c: COLORS.success }].map((m, i) => (
          <View key={i} style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: m.c }]} />
            <Text style={s.legendText}>{m.l}: {m.w} kg</Text>
          </View>
        ))}
      </View>
    </View>
  );
};


const HrZonesChart: React.FC<{ data: HrZonesResult }> = ({ data }) => {
  const zones = [
    { name: 'Zone 1', value: data.zone1, color: COLORS.lightBlue, desc: 'Recovery' },
    { name: 'Zone 2', value: data.zone2, color: COLORS.success, desc: 'Fat Burn' },
    { name: 'Zone 3', value: data.zone3, color: COLORS.warning, desc: 'Cardio' },
    { name: 'Zone 4', value: data.zone4, color: COLORS.orange, desc: 'Threshold' },
    { name: 'Zone 5', value: data.zone5, color: COLORS.danger, desc: 'Max' },
  ];


  return (
    <View style={s.hrCon}>
      <Text style={s.title}>Heart Rate Training Zones</Text>
      <Text style={s.subtitle}>Max HR: {data.maxHR} bpm</Text>
      <View style={s.hrBar}>
        {zones.map((z, i) => <View key={z.name} style={[s.hrZone, { backgroundColor: z.color },
          i === 0 && s.hrFirst, i === zones.length - 1 && s.hrLast]} />)}
      </View>
      <View style={s.hrList}>
        {zones.map(z => (
          <View key={z.name} style={s.hrItem}>
            <View style={[s.hrDot, { backgroundColor: z.color }]} />
            <View style={s.hrInfo}>
              <Text style={s.hrName}>{z.name}</Text>
              <Text style={s.hrDesc}>{z.desc}</Text>
            </View>
            <Text style={s.hrValue}>{z.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};


const Vo2MaxChart: React.FC<{ data: Vo2maxResult }> = ({ data }) => {
  const vo2 = parseFloat(data.value);
  const levels = [
    { label: 'Poor', max: 30, color: COLORS.danger }, { label: 'Below Avg', max: 38, color: COLORS.orange },
    { label: 'Average', max: 46, color: COLORS.warning }, { label: 'Good', max: 54, color: COLORS.info },
    { label: 'Excellent', max: 62, color: COLORS.success }, { label: 'Superior', max: 75, color: COLORS.primary },
  ];
  const curr = levels.find(l => vo2 <= l.max);


  return (
    <View style={s.vo2Con}>
      <Text style={s.title}>VOâ‚‚max Fitness Level</Text>
      <View style={s.vo2Scale}>
        {levels.map((l, i) => {
          const prev = i > 0 ? levels[i - 1].max : 0;
          const active = l.label === curr?.label;
          return (
            <View key={l.label} style={[s.vo2Level, {
              backgroundColor: l.color + (active ? 'FF' : '40'),
              borderWidth: active ? 2 : 0, borderColor: l.color
            }]}>
              <Text style={[s.vo2Label, { opacity: active ? 1 : 0.6 }]}>{l.label}</Text>
              <Text style={[s.vo2Range, { opacity: active ? 1 : 0.6 }]}>{prev}-{l.max}</Text>
            </View>
          );
        })}
      </View>
      <Text style={s.vo2Value}>Your VOâ‚‚max: {data.value} ml/kg/min</Text>
      <Text style={s.vo2Cat}>Category: {curr?.label}</Text>
    </View>
  );
};


const ActivityChart: React.FC<{ data: ActivityResult; inputs?: ActivityInputs }> = ({ data, inputs }) => {
  const acts = ['walking', 'running', 'cycling', 'swimming', 'weightlifting'];
  const curr = inputs?.type || 'walking';
  const mets: Record<string, number> = { walking: 4.5, running: 10, cycling: 8, swimming: 7, weightlifting: 5 };
  const chartData = {
    labels: ['Walk', 'Run', 'Cycle', 'Swim', 'Lift'],
    datasets: [{
      data: acts.map(a => Math.round((data.value / mets[curr]) * mets[a])),
      colors: acts.map(a => () => a === curr ? COLORS.primary : COLORS.info + '40'),
    }],
  };


  return (
    <View style={s.barCon}>
      <Text style={s.title}>Calories by Activity</Text>
      <View style={s.chartWrap}>
        <BarChart data={chartData} width={SCREEN_WIDTH - 100} height={160} chartConfig={CHART_CONFIG}
          fromZero showValuesOnTopOfBars withInnerLines={false} yAxisLabel="" yAxisSuffix="" />
      </View>
      <Text style={s.note}>Highlighted: Your activity</Text>
    </View>
  );
};


const RatiosChart: React.FC<{ data: RatiosResult }> = ({ data }) => {
  const whtr = parseFloat(data.whtr), whr = parseFloat(data.whr);
  const whtrS = whtr < 0.5 ? 'Healthy' : whtr < 0.6 ? 'Caution' : 'Risk';
  const whrS = whr < 0.85 ? 'Low Risk' : whr < 0.95 ? 'Moderate' : 'High Risk';
  const whtrC = whtr < 0.5 ? COLORS.success : whtr < 0.6 ? COLORS.warning : COLORS.danger;
  const whrC = whr < 0.85 ? COLORS.success : whr < 0.95 ? COLORS.warning : COLORS.danger;


  return (
    <View style={s.ratioCon}>
      <Text style={s.title}>Body Ratios Analysis</Text>
      {[{ label: 'Waist-to-Height', val: data.whtr, stat: whtrS, color: whtrC, pct: whtr * 100 },
        { label: 'Waist-to-Hip', val: data.whr, stat: whrS, color: whrC, pct: whr * 80 }].map((r, i) => (
        <View key={i} style={s.ratioSec}>
          <View style={s.ratioHeader}>
            <Text style={s.ratioLabel}>{r.label}</Text>
            <Text style={[s.ratioValue, { color: r.color }]}>{r.val}</Text>
          </View>
          <View style={s.progBarCon}>
            <View style={s.progBarBg}>
              <View style={[s.progBarFill, { width: `${Math.min(r.pct, 100)}%`, backgroundColor: r.color }]} />
            </View>
          </View>
          <View style={s.ratioScale}>
            {i === 0 ? ['0.4', '0.5', '0.6'].map((t, j) => <Text key={j} style={s.ratioScaleText}>{t}</Text>) :
                       ['0.7', '0.85', '0.95'].map((t, j) => <Text key={j} style={s.ratioScaleText}>{t}</Text>)}
          </View>
          <Text style={[s.ratioStat, { color: r.color }]}>{r.stat}</Text>
        </View>
      ))}
    </View>
  );
};


const WaterChart: React.FC<{ data: WaterResult }> = ({ data }) => {
  const liters = parseFloat(data.value), glasses = Math.ceil(liters * 4);
  const items: MarkingItem[] = [
    { label: 'Morning', value: `${Math.ceil(glasses * 0.3)}ðŸ¥›` },
    { label: 'Afternoon', value: `${Math.ceil(glasses * 0.4)}ðŸ¥›` },
    { label: 'Evening', value: `${Math.ceil(glasses * 0.3)}ðŸ¥›` },
  ];


  return (
    <View style={s.waterCon}>
      <Text style={s.title}>Daily Water Intake</Text>
      <View style={s.waterGlassCon}>
        <View style={s.waterGlass}>
          <View style={[s.waterFill, { height: `${Math.min((glasses / 16) * 100, 100)}%`, backgroundColor: COLORS.info }]} />
        </View>
        <View style={s.waterLabels}>
          <Text style={s.waterAmt}>{data.value}L</Text>
          <Text style={s.waterGls}>â‰ˆ {glasses} glasses</Text>
          <Text style={s.waterNote}>(250ml each)</Text>
        </View>
      </View>
      <MealMarkingGrid items={items} />
    </View>
  );
};


const RunningChart: React.FC<{ data: RunningResult }> = ({ data }) => {
  const speed = parseFloat(data.speed);
  const zones = [
    { name: 'Easy Run', minSpeed: 6, maxSpeed: 9, color: COLORS.success },
    { name: 'Marathon', minSpeed: 9, maxSpeed: 12, color: COLORS.info },
    { name: 'Tempo', minSpeed: 12, maxSpeed: 15, color: COLORS.warning },
    { name: 'Interval', minSpeed: 15, maxSpeed: 20, color: COLORS.danger },
  ];
  const curr = zones.find(z => speed >= z.minSpeed && speed < z.maxSpeed);


  return (
    <View style={s.runCon}>
      <Text style={s.title}>Running Pace Analysis</Text>
      <View style={s.runStats}>
        <View style={s.runStat}>
          <Text style={s.runStatLabel}>Pace</Text>
          <Text style={s.runStatValue}>{data.pace}</Text>
          <Text style={s.runStatUnit}>min/km</Text>
        </View>
        <View style={s.divider} />
        <View style={s.runStat}>
          <Text style={s.runStatLabel}>Speed</Text>
          <Text style={s.runStatValue}>{data.speed}</Text>
          <Text style={s.runStatUnit}>km/h</Text>
        </View>
      </View>
      <View style={s.runZones}>
        {zones.map(z => {
          const active = z.name === curr?.name;
          return (
            <View key={z.name} style={[s.runZone, {
              backgroundColor: z.color + (active ? 'FF' : '30'),
              borderWidth: active ? 2 : 0, borderColor: z.color
            }]}>
              <Text style={[s.runZoneName, { opacity: active ? 1 : 0.7 }]}>{z.name}</Text>
              <Text style={[s.runZoneRange, { opacity: active ? 1 : 0.7 }]}>{z.minSpeed}-{z.maxSpeed} km/h</Text>
            </View>
          );
        })}
      </View>
      {curr && <Text style={s.runCurrZone}>Your pace: <Text style={{ fontWeight: '700' }}>{curr.name}</Text></Text>}
    </View>
  );
};


const ProteinChart: React.FC<{ data: ProteinResult; inputs?: ProteinInputs }> = ({ data, inputs }) => {
  const base = 50;
  const goal = inputs?.goal === 'gain' ? 20 : inputs?.goal === 'lose' ? 10 : 0;
  const act = data.value - base - goal;
  const perMeal = Math.round(data.value / 4);
  const items: MarkingItem[] = Array.from({ length: 4 }).map((_, i) => ({ label: `Meal ${i + 1}`, value: `~${perMeal}g` }));


  return (
    <View style={s.protCon}>
      <Text style={s.title}>Protein Breakdown</Text>
      <View style={s.protBar}>
        <View style={[s.protSeg, { flex: base, backgroundColor: COLORS.primary }]}>
          <Text style={s.protSegText}>{base}g</Text>
          <Text style={s.protSegLabel}>Base</Text>
        </View>
        {act > 0 && (
          <View style={[s.protSeg, { flex: act, backgroundColor: COLORS.info }]}>
            <Text style={s.protSegText}>{Math.round(act)}g</Text>
            <Text style={s.protSegLabel}>Activity</Text>
          </View>
        )}
        {goal > 0 && (
          <View style={[s.protSeg, { flex: goal, backgroundColor: COLORS.success }]}>
            <Text style={s.protSegText}>{goal}g</Text>
            <Text style={s.protSegLabel}>Goal</Text>
          </View>
        )}
      </View>
      <Text style={s.protTotal}>Total: {data.value}g/day</Text>
      <View style={s.protMeals}>
        <Text style={s.protMealsTitle}>Suggested Distribution</Text>
        <MealMarkingGrid items={items} />
      </View>
    </View>
  );
};


// ============================================================================
// BIOHACKING CHARTS
// ============================================================================


const HrvChart: React.FC<{ data: HrvResult }> = ({ data }) => {
  const score = data.score;
  const getColor = () => {
    if (score >= 80) return COLORS.success;
    if (score >= 60) return COLORS.info;
    if (score >= 40) return COLORS.warning;
    return COLORS.danger;
  };

  return (
    <View style={s.bioHrvCon}>
      <Text style={s.title}>HRV Recovery Score</Text>
      
      {/* Circular gauge */}
      <View style={s.bioGaugeCon}>
        <View style={[s.bioGaugeCircle, { borderColor: getColor() }]}>
          <Text style={[s.bioGaugeScore, { color: getColor() }]}>{score}</Text>
          <Text style={s.bioGaugeLabel}>/ 100</Text>
        </View>
      </View>

      {/* Category badge */}
      <View style={[s.bioCategoryBadge, { backgroundColor: getColor() + '20', borderColor: getColor() }]}>
        <Text style={[s.bioCategoryText, { color: getColor() }]}>{data.category}</Text>
      </View>

      {/* Recommendation */}
      <View style={s.bioRecommendBox}>
        <Text style={s.bioRecommendTitle}>ðŸ’¡ Recommendation</Text>
        <Text style={s.bioRecommendText}>{data.recommendation}</Text>
      </View>
    </View>
  );
};


const RecoveryChart: React.FC<{ data: RecoveryResult }> = ({ data }) => {
  const score = data.score;
  const getColor = () => {
    if (score >= 80) return COLORS.success;
    if (score >= 60) return COLORS.info;
    if (score >= 40) return COLORS.warning;
    return COLORS.danger;
  };

  // Recovery components breakdown
  const components = [
    { label: 'HRV', value: 40, color: COLORS.primary },
    { label: 'Sleep', value: 35, color: COLORS.info },
    { label: 'Resting HR', value: 25, color: COLORS.purple },
  ];

  return (
    <View style={s.bioRecoveryCon}>
      <Text style={s.title}>Recovery Analysis</Text>
      
      {/* Main score with radial progress */}
      <View style={s.bioRadialCon}>
        <View style={[s.bioRadialOuter, { borderColor: getColor() }]}>
          <View style={[s.bioRadialInner, { borderColor: getColor() + '40' }]}>
            <Text style={[s.bioRadialScore, { color: getColor() }]}>{score}</Text>
            <Text style={s.bioRadialSubtext}>{data.category}</Text>
          </View>
        </View>
      </View>

      {/* Component breakdown */}
      <View style={s.bioComponentsCon}>
        <Text style={s.bioComponentsTitle}>Score Breakdown</Text>
        {components.map((comp, i) => (
          <View key={i} style={s.bioComponentRow}>
            <View style={[s.bioComponentDot, { backgroundColor: comp.color }]} />
            <Text style={s.bioComponentLabel}>{comp.label}</Text>
            <Text style={s.bioComponentValue}>{comp.value}%</Text>
          </View>
        ))}
      </View>

      {/* Advice */}
      <View style={[s.bioAdviceBox, { backgroundColor: getColor() + '10', borderLeftColor: getColor() }]}>
        <Text style={s.bioAdviceText}>{data.advice}</Text>
      </View>
    </View>
  );
};


const SleepQualityChart: React.FC<{ data: SleepQualityResult }> = ({ data }) => {
  const score = data.score;
  const getColor = () => {
    if (score >= 85) return COLORS.success;
    if (score >= 70) return COLORS.info;
    if (score >= 50) return COLORS.warning;
    return COLORS.danger;
  };

  return (
    <View style={s.bioSleepCon}>
      <Text style={s.title}>Sleep Quality Score</Text>
      
      {/* Score display */}
      <View style={s.bioScoreDisplay}>
        <Text style={[s.bioScoreValue, { color: getColor() }]}>{score}</Text>
        <Text style={s.bioScoreMax}>/ 100</Text>
        <Text style={[s.bioScoreQuality, { color: getColor() }]}>{data.quality}</Text>
      </View>

      {/* Progress bar */}
      <View style={s.bioProgressBarCon}>
        <View style={s.bioProgressBarBg}>
          <View style={[s.bioProgressBarFill, { width: `${score}%`, backgroundColor: getColor() }]} />
        </View>
      </View>

      {/* Improvements list */}
      <View style={s.bioImprovementsCon}>
        <Text style={s.bioImprovementsTitle}>âœ¨ Improvements</Text>
        {data.improvements.map((tip, i) => (
          <View key={i} style={s.bioImprovementItem}>
            <Text style={s.bioImprovementBullet}>â€¢</Text>
            <Text style={s.bioImprovementText}>{tip}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};
// ✅ NEW: Sleep Graph Chart - Line chart showing sleep history
const SleepGraphChart: React.FC<{ data: SleepGraphResult }> = ({ data }) => {
  if (data.totalSessions === 0) {
    return (
      <View style={s.bioSleepGraphCon}>
        <Text style={s.title}>Sleep History (30 Days)</Text>
        <View style={s.emptyStateBox}>
          <Text style={s.emptyStateEmoji}>😴</Text>
          <Text style={s.emptyStateText}>No sleep data yet</Text>
          <Text style={s.emptyStateSubtext}>Use the Sleep Quality tab to start tracking</Text>
        </View>
      </View>
    );
  }

  // Prepare data for line chart
  const chartData = {
    labels: data.sessions.slice(-7).map(s => {
      const date = new Date(s.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }),
    datasets: [{
      data: data.sessions.slice(-7).map(s => s.hours),
      color: (opacity = 1) => `rgba(67, 97, 238, ${opacity})`,
      strokeWidth: 3,
    }],
  };

  const getColor = (hours: number) => {
    if (hours >= 7 && hours <= 9) return COLORS.success;
    if (hours >= 6) return COLORS.info;
    return COLORS.warning;
  };

  const avgColor = getColor(data.averageDuration);
  const consistencyColor = data.consistency >= 70 ? COLORS.success : data.consistency >= 50 ? COLORS.info : COLORS.warning;

  return (
    <View style={s.bioSleepGraphCon}>
      <Text style={s.title}>Sleep History (Last 30 Days)</Text>

      {/* Summary Cards */}
      <View style={s.sleepSummaryRow}>
        <View style={[s.sleepSummaryCard, { backgroundColor: avgColor + '20', borderColor: avgColor }]}>
          <Text style={[s.sleepSummaryValue, { color: avgColor }]}>{data.averageDuration}h</Text>
          <Text style={s.sleepSummaryLabel}>Average</Text>
        </View>
        <View style={[s.sleepSummaryCard, { backgroundColor: consistencyColor + '20', borderColor: consistencyColor }]}>
          <Text style={[s.sleepSummaryValue, { color: consistencyColor }]}>{data.consistency}%</Text>
          <Text style={s.sleepSummaryLabel}>Consistency</Text>
        </View>
        <View style={[s.sleepSummaryCard, { backgroundColor: COLORS.primary + '20', borderColor: COLORS.primary }]}>
          <Text style={[s.sleepSummaryValue, { color: COLORS.primary }]}>{data.totalSessions}</Text>
          <Text style={s.sleepSummaryLabel}>Sessions</Text>
        </View>
      </View>

      {/* Line Chart */}
      {data.sessions.length >= 2 && (
        <View style={s.chartWrap}>
          <BarChart
            data={chartData}
            width={SCREEN_WIDTH - 100}
            height={160}
            chartConfig={{
              ...CHART_CONFIG,
              decimalPlaces: 1,
            }}
            fromZero
            showValuesOnTopOfBars
            withInnerLines={true}
            yAxisLabel=""
            yAxisSuffix="h"
          />
        </View>
      )}

      {/* Stats Grid */}
      <View style={s.sleepStatsGrid}>
        <View style={s.sleepStatItem}>
          <Text style={s.sleepStatLabel}>Last 7 Days</Text>
          <Text style={s.sleepStatValue}>{data.last7DaysAvg}h avg</Text>
        </View>
        <View style={s.sleepStatDivider} />
        <View style={s.sleepStatItem}>
          <Text style={s.sleepStatLabel}>Longest</Text>
          <Text style={s.sleepStatValue}>{data.longestSleep}h</Text>
        </View>
        <View style={s.sleepStatDivider} />
        <View style={s.sleepStatItem}>
          <Text style={s.sleepStatLabel}>Shortest</Text>
          <Text style={s.sleepStatValue}>{data.shortestSleep}h</Text>
        </View>
      </View>

      {/* Insights */}
      <View style={s.sleepInsightBox}>
        <Text style={s.sleepInsightTitle}>💡 Insights</Text>
        {data.averageDuration >= 7 && data.averageDuration <= 9 ? (
          <Text style={s.sleepInsightText}>
            Excellent! You're consistently getting the recommended 7-9 hours of sleep.
          </Text>
        ) : data.averageDuration < 7 ? (
          <Text style={s.sleepInsightText}>
            You're averaging {data.averageDuration} hours per night. Try to aim for 7-9 hours for optimal health.
          </Text>
        ) : (
          <Text style={s.sleepInsightText}>
            You're sleeping over 9 hours on average. Ensure the quality of your sleep is good.
          </Text>
        )}
        {data.consistency < 50 && (
          <Text style={[s.sleepInsightText, { marginTop: 8 }]}>
            💤 Your sleep schedule is inconsistent. Try going to bed and waking up at the same time daily.
          </Text>
        )}
      </View>
    </View>
  );
};


const StressChart: React.FC<{ data: StressResult }> = ({ data }) => {
  const level = data.level;
  const getColor = () => {
    if (level < 30) return COLORS.success;
    if (level < 50) return COLORS.info;
    if (level < 70) return COLORS.warning;
    return COLORS.danger;
  };

  const getEmoji = () => {
    if (level < 30) return 'ðŸ˜Œ';
    if (level < 50) return 'ðŸ™‚';
    if (level < 70) return 'ðŸ˜°';
    return 'ðŸ˜«';
  };

  return (
    <View style={s.bioStressCon}>
      <Text style={s.title}>Stress Level Analysis</Text>
      
      {/* Stress meter */}
      <View style={s.bioStressMeterCon}>
        <View style={s.bioStressMeter}>
          {/* Zones background */}
          <View style={s.bioStressZones}>
            <View style={[s.bioStressZone, { backgroundColor: COLORS.success + '40' }]} />
            <View style={[s.bioStressZone, { backgroundColor: COLORS.info + '40' }]} />
            <View style={[s.bioStressZone, { backgroundColor: COLORS.warning + '40' }]} />
            <View style={[s.bioStressZone, { backgroundColor: COLORS.danger + '40' }]} />
          </View>
          {/* Indicator needle */}
          <View style={[s.bioStressNeedle, { left: `${level}%`, backgroundColor: getColor() }]}>
            <Text style={s.bioStressEmoji}>{getEmoji()}</Text>
          </View>
        </View>
        <View style={s.bioStressLabels}>
          <Text style={s.bioStressLabelText}>Low</Text>
          <Text style={s.bioStressLabelText}>Moderate</Text>
          <Text style={s.bioStressLabelText}>High</Text>
          <Text style={s.bioStressLabelText}>Very High</Text>
        </View>
      </View>

      {/* Category */}
      <View style={[s.bioStressCategoryBox, { backgroundColor: getColor() + '20', borderColor: getColor() }]}>
        <Text style={[s.bioStressCategoryText, { color: getColor() }]}>
          {data.category} Stress â€¢ {level}/100
        </Text>
      </View>

      {/* Tips */}
      <View style={s.bioTipsCon}>
        <Text style={s.bioTipsTitle}>ðŸ§˜ Management Tips</Text>
        {data.tips.map((tip, i) => (
          <View key={i} style={s.bioTipItem}>
            <Text style={s.bioTipBullet}>â€¢</Text>
            <Text style={s.bioTipText}>{tip}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};


const s = StyleSheet.create({
  container: { marginTop: 16, marginBottom: 8, paddingHorizontal: 16 },
  title: { fontSize: 11, fontWeight: '600', color: Colors.light.text, marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 10, color: Colors.light.textSecondary, marginBottom: 8, textAlign: 'center' },
  note: { fontSize: 9, color: Colors.light.textSecondary, marginTop: 8, textAlign: 'center', fontStyle: 'italic' },
  chartWrap: { width: '100%', alignItems: 'center', overflow: 'hidden' },
  
  // Marking Grid
  markingGrid: { marginTop: 12, width: '100%' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, gap: 8 },
  rowCenter: { flexDirection: 'row', justifyContent: 'center', marginBottom: 8 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  markingItem: { flex: 1, minWidth: '45%', maxWidth: '48%', backgroundColor: Colors.light.background, padding: 10, borderRadius: 8, alignItems: 'center' },
  markingLabel: { fontSize: 9, color: Colors.light.textSecondary, marginBottom: 4 },
  markingValue: { fontSize: 12, fontWeight: '700', color: Colors.light.text },


  // BMI
  bmiCon: { paddingVertical: 16 },
  bmiScale: { flexDirection: 'row', height: 40, borderRadius: 8, overflow: 'hidden', marginBottom: 32 },
  bmiZone: { flex: 1 },
  bmiInd: { position: 'absolute', top: 0, transform: [{ translateX: -12 }], alignItems: 'center' },
  bmiDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.light.text, borderWidth: 3, borderColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  bmiText: { fontSize: 10, fontWeight: '700', color: Colors.light.text, marginTop: 4 },
  bmiLabels: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 },
  bmiLabel: { fontSize: 10, fontWeight: '600', color: Colors.light.text },
  bmiRanges: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 4 },
  bmiRange: { fontSize: 9, color: Colors.light.textSecondary },


  // Pie & Bar
  pieCon: { alignItems: 'center', paddingVertical: 8 },
  barCon: { paddingVertical: 8 },
  macroPercents: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 12 },
  macroPercent: { fontSize: 11, fontWeight: '600', color: Colors.light.text },
  tdeeComp: { flexDirection: 'row', marginTop: 16, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'space-around' },
  tdeeItem: { alignItems: 'center' },
  tdeeLabel: { fontSize: 10, color: Colors.light.textSecondary, marginBottom: 4 },
  tdeeValue: { fontSize: 14, fontWeight: '700', color: Colors.light.text },
  divider: { width: 1, height: 40, backgroundColor: Colors.light.border },


  // OneRM
  oneRmCon: { paddingVertical: 8 },
  oneRmRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  oneRmPerc: { fontSize: 11, fontWeight: '700', color: Colors.light.text, width: 35 },
  oneRmBarCon: { flex: 1, height: 28, backgroundColor: Colors.light.background, borderRadius: 6, overflow: 'hidden' },
  oneRmBar: { height: '100%', paddingLeft: 8 },
  oneRmWeight: { fontSize: 11, fontWeight: '700', color: Colors.light.text, width: 45 },
  oneRmReps: { fontSize: 9, color: Colors.light.textSecondary, width: 65 },


// Body Fat (NEW - vertical thermometer)
bfCon: { paddingVertical: 12, alignItems: 'center' },
bfVerticalContainer: { flexDirection: 'row', height: 220, width: '100%', marginVertical: 16, position: 'relative' },
bfVerticalBar: { width: 60, height: '100%', borderRadius: 8, overflow: 'hidden', marginLeft: 20 },
bfVerticalZone: { width: '100%' },


// Pointer styles
bfPointer: { position: 'absolute', left: 85, flexDirection: 'row', alignItems: 'center', zIndex: 10 },
bfPointerTriangle: { 
  width: 0, height: 0, 
  borderTopWidth: 8, borderTopColor: 'transparent',
  borderBottomWidth: 8, borderBottomColor: 'transparent',
  borderLeftWidth: 12, borderLeftColor: Colors.light.primary,
},
bfPointerLine: { width: 8, height: 2, backgroundColor: Colors.light.primary },
bfPointerValueBox: { 
  backgroundColor: Colors.light.primary, 
  paddingHorizontal: 8, 
  paddingVertical: 4, 
  borderRadius: 6,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 3,
  elevation: 4,
},
bfPointerValue: { fontSize: 12, fontWeight: '700', color: '#FFF' },


// Labels on right
bfLabelsContainer: { flex: 1, height: '100%', marginLeft: 12, position: 'relative' },
bfLabelItem: { position: 'absolute', width: '100%', justifyContent: 'center' },
bfLabelText: { fontSize: 11, marginBottom: 2 },
bfLabelRange: { fontSize: 9 },


// Bottom indicator
bfBottomInd: { alignItems: 'center', marginTop: 12 },
bfValue: { fontSize: 14, fontWeight: '700', color: Colors.light.primary },
bfCat: { fontSize: 11, color: Colors.light.textSecondary, marginTop: 4 },



  // Ideal Weight
  iwCon: { paddingVertical: 8 },
  iwScale: { marginVertical: 16 },
  iwBar: { height: 40, position: 'relative' },
  iwRange: { position: 'absolute', width: '100%', height: 8, backgroundColor: Colors.light.background, borderRadius: 4, top: 16 },
  iwMarker: { position: 'absolute', width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', top: 5, transform: [{ translateX: -15 }], borderWidth: 2, borderColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 4 },
  iwMarkerText: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  iwAxisLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  iwAxisLabel: { fontSize: 9, color: Colors.light.textSecondary },
  iwLegend: { marginTop: 16, gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 11, height: 11, borderRadius: 6 },
  legendText: { fontSize: 10, color: Colors.light.text },


  // HR Zones
  hrCon: { paddingVertical: 8 },
  hrBar: { flexDirection: 'row', height: 40, marginBottom: 16, overflow: 'hidden' },
  hrZone: { flex: 1 },
  hrFirst: { borderTopLeftRadius: 8, borderBottomLeftRadius: 8 },
  hrLast: { borderTopRightRadius: 8, borderBottomRightRadius: 8 },
  hrList: { gap: 8 },
  hrItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hrDot: { width: 13, height: 13, borderRadius: 7 },
  hrInfo: { flex: 1 },
  hrName: { fontSize: 11, fontWeight: '600', color: Colors.light.text },
  hrDesc: { fontSize: 9, color: Colors.light.textSecondary },
  hrValue: { fontSize: 11, fontWeight: '700', color: Colors.light.text },


  // VO2Max
  vo2Con: { paddingVertical: 8 },
  vo2Scale: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  vo2Level: { flex: 1, minWidth: '30%', padding: 10, borderRadius: 8, alignItems: 'center' },
  vo2Label: { fontSize: 9, fontWeight: '700', color: '#FFF' },
  vo2Range: { fontSize: 8, color: '#FFF', marginTop: 2 },
  vo2Value: { fontSize: 13, fontWeight: '700', color: Colors.light.primary, textAlign: 'center', marginTop: 8 },
  vo2Cat: { fontSize: 11, color: Colors.light.textSecondary, textAlign: 'center', marginTop: 4 },


  // Ratios
  ratioCon: { paddingVertical: 8 },
  ratioSec: { marginBottom: 20 },
  ratioHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  ratioLabel: { fontSize: 11, fontWeight: '600', color: Colors.light.text },
  ratioValue: { fontSize: 14, fontWeight: '700' },
  progBarCon: { marginBottom: 8 },
  progBarBg: { height: 22, backgroundColor: Colors.light.background, borderRadius: 11, overflow: 'hidden' },
  progBarFill: { height: '100%', borderRadius: 11 },
  ratioScale: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  ratioScaleText: { fontSize: 8, color: Colors.light.textSecondary },
  ratioStat: { fontSize: 10, fontWeight: '600', textAlign: 'center' },


  // Water
  waterCon: { paddingVertical: 8, alignItems: 'center' },
  waterGlassCon: { flexDirection: 'row', alignItems: 'center', gap: 20, marginVertical: 16 },
  waterGlass: { width: 70, height: 150, backgroundColor: Colors.light.background, borderRadius: 8, borderWidth: 3, borderColor: COLORS.info, overflow: 'hidden', justifyContent: 'flex-end' },
  waterFill: { width: '100%', borderRadius: 4 },
  waterLabels: { alignItems: 'flex-start' },
  waterAmt: { fontSize: 20, fontWeight: '700', color: COLORS.info },
  waterGls: { fontSize: 14, color: Colors.light.text, marginTop: 4 },
  waterNote: { fontSize: 9, color: Colors.light.textSecondary },


  // Running
  runCon: { paddingVertical: 8 },
  runStats: { flexDirection: 'row', marginBottom: 16, backgroundColor: Colors.light.background, borderRadius: 12, padding: 14, alignItems: 'center' },
  runStat: { flex: 1, alignItems: 'center' },
  runStatLabel: { fontSize: 10, color: Colors.light.textSecondary, marginBottom: 4 },
  runStatValue: { fontSize: 17, fontWeight: '700', color: Colors.light.primary },
  runStatUnit: { fontSize: 9, color: Colors.light.textSecondary, marginTop: 2 },
  runZones: { gap: 8 },
  runZone: { padding: 10, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  runZoneName: { fontSize: 11, fontWeight: '600', color: Colors.light.text },
  runZoneRange: { fontSize: 9, color: Colors.light.textSecondary },
  runCurrZone: { fontSize: 10, color: Colors.light.text, textAlign: 'center', marginTop: 12 },


  // Protein
  protCon: { paddingVertical: 8 },
  protBar: { flexDirection: 'row', height: 52, borderRadius: 8, overflow: 'hidden', marginBottom: 12 },
  protSeg: { justifyContent: 'center', alignItems: 'center', padding: 4 },
  protSegText: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  protSegLabel: { fontSize: 8, color: '#FFF', marginTop: 2 },
  protTotal: { fontSize: 14, fontWeight: '700', color: Colors.light.primary, textAlign: 'center', marginBottom: 16 },
  protMeals: { marginTop: 8 },
  protMealsTitle: { fontSize: 10, fontWeight: '600', color: Colors.light.text, marginBottom: 12, textAlign: 'center' },

  // ============================================================================
  // BIOHACKING STYLES
  // ============================================================================

  // HRV Chart
  bioHrvCon: { paddingVertical: 12, alignItems: 'center' },
  bioGaugeCon: { marginVertical: 20 },
  bioGaugeCircle: { 
    width: 140, 
    height: 140, 
    borderRadius: 70, 
    borderWidth: 12, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  bioGaugeScore: { fontSize: 42, fontWeight: '700' },
  bioGaugeLabel: { fontSize: 14, color: Colors.light.textSecondary, marginTop: 4 },
  bioCategoryBadge: { 
    paddingHorizontal: 20, 
    paddingVertical: 8, 
    borderRadius: 20, 
    borderWidth: 2, 
    marginTop: 12 
  },
  bioCategoryText: { fontSize: 13, fontWeight: '700' },
  bioRecommendBox: { 
    marginTop: 20, 
    backgroundColor: Colors.light.background, 
    padding: 14, 
    borderRadius: 10, 
    width: '100%' 
  },
  bioRecommendTitle: { fontSize: 12, fontWeight: '700', color: Colors.light.text, marginBottom: 8 },
  bioRecommendText: { fontSize: 11, color: Colors.light.textSecondary, lineHeight: 16 },

  // Recovery Chart
  bioRecoveryCon: { paddingVertical: 12, alignItems: 'center' },
  bioRadialCon: { marginVertical: 20 },
  bioRadialOuter: { 
    width: 160, 
    height: 160, 
    borderRadius: 80, 
    borderWidth: 8, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  bioRadialInner: { 
    width: 120, 
    height: 120, 
    borderRadius: 60, 
    borderWidth: 6, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
  },
  bioRadialScore: { fontSize: 38, fontWeight: '700' },
  bioRadialSubtext: { fontSize: 11, color: Colors.light.textSecondary, marginTop: 4 },
  bioComponentsCon: { width: '100%', marginTop: 16, backgroundColor: Colors.light.background, padding: 12, borderRadius: 10 },
  bioComponentsTitle: { fontSize: 11, fontWeight: '700', color: Colors.light.text, marginBottom: 10 },
  bioComponentRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  bioComponentDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  bioComponentLabel: { flex: 1, fontSize: 10, color: Colors.light.text },
  bioComponentValue: { fontSize: 11, fontWeight: '700', color: Colors.light.text },
  bioAdviceBox: { 
    marginTop: 12, 
    padding: 12, 
    borderRadius: 8, 
    borderLeftWidth: 4, 
    width: '100%' 
  },
  bioAdviceText: { fontSize: 11, color: Colors.light.text, lineHeight: 16 },

  // Sleep Quality Chart
  bioSleepCon: { paddingVertical: 12, alignItems: 'center' },
  bioScoreDisplay: { alignItems: 'center', marginVertical: 16 },
  bioScoreValue: { fontSize: 48, fontWeight: '700' },
  bioScoreMax: { fontSize: 16, color: Colors.light.textSecondary },
  bioScoreQuality: { fontSize: 14, fontWeight: '700', marginTop: 8 },
  bioProgressBarCon: { width: '100%', marginTop: 12 },
  bioProgressBarBg: { 
    height: 16, 
    backgroundColor: Colors.light.background, 
    borderRadius: 8, 
    overflow: 'hidden' 
  },
  bioProgressBarFill: { height: '100%', borderRadius: 8 },
  bioImprovementsCon: { width: '100%', marginTop: 20 },
  bioImprovementsTitle: { fontSize: 12, fontWeight: '700', color: Colors.light.text, marginBottom: 12 },
  bioImprovementItem: { flexDirection: 'row', marginBottom: 10, paddingRight: 8 },
  bioImprovementBullet: { fontSize: 14, color: Colors.light.primary, marginRight: 8, marginTop: -2 },
  bioImprovementText: { flex: 1, fontSize: 11, color: Colors.light.textSecondary, lineHeight: 16 },

  // Stress Chart
  bioStressCon: { paddingVertical: 12 },
  bioStressMeterCon: { marginVertical: 20 },
  bioStressMeter: { 
    height: 60, 
    backgroundColor: Colors.light.background, 
    borderRadius: 30, 
    overflow: 'hidden', 
    position: 'relative' 
  },
  bioStressZones: { flexDirection: 'row', height: '100%' },
  bioStressZone: { flex: 1 },
  bioStressNeedle: { 
    position: 'absolute', 
    top: 0, 
    width: 4, 
    height: '100%', 
    transform: [{ translateX: -2 }] 
  },
  bioStressEmoji: { 
    position: 'absolute', 
    top: -30, 
    fontSize: 24, 
    left: -10 
  },
  bioStressLabels: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 8, 
    paddingHorizontal: 4 
  },
  bioStressLabelText: { fontSize: 8, color: Colors.light.textSecondary, flex: 1, textAlign: 'center' },
  bioStressCategoryBox: { 
    marginTop: 16, 
    paddingVertical: 10, 
    paddingHorizontal: 16, 
    borderRadius: 8, 
    borderWidth: 2, 
    alignItems: 'center' 
  },
  bioStressCategoryText: { fontSize: 13, fontWeight: '700' },
  bioTipsCon: { marginTop: 20 },
  bioTipsTitle: { fontSize: 12, fontWeight: '700', color: Colors.light.text, marginBottom: 12 },
  bioTipItem: { flexDirection: 'row', marginBottom: 10, paddingRight: 8 },
  bioTipBullet: { fontSize: 14, color: Colors.light.primary, marginRight: 8, marginTop: -2 },  
  bioTipText: { flex: 1, fontSize: 11, color: Colors.light.textSecondary, lineHeight: 16 },
  // Sleep Graph Chart
  bioSleepGraphCon: { paddingVertical: 12, alignItems: 'center' },
  
  sleepSummaryRow: { 
    flexDirection: 'row', 
    width: '100%', 
    gap: 8, 
    marginTop: 12, 
    marginBottom: 16 
  },
  sleepSummaryCard: { 
    flex: 1, 
    padding: 12, 
    borderRadius: 10, 
    borderWidth: 2, 
    alignItems: 'center' 
  },
  sleepSummaryValue: { 
    fontSize: 20, 
    fontWeight: '700' 
  },
  sleepSummaryLabel: { 
    fontSize: 9, 
    color: Colors.light.textSecondary, 
    marginTop: 4 
  },
  
  sleepStatsGrid: { 
    flexDirection: 'row', 
    width: '100%', 
    backgroundColor: Colors.light.background, 
    borderRadius: 10, 
    padding: 14, 
    marginTop: 16,
    alignItems: 'center',
  },
  sleepStatItem: { 
    flex: 1, 
    alignItems: 'center' 
  },
  sleepStatDivider: { 
    width: 1, 
    height: 40, 
    backgroundColor: Colors.light.border 
  },
  sleepStatLabel: { 
    fontSize: 9, 
    color: Colors.light.textSecondary, 
    marginBottom: 6 
  },
  sleepStatValue: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: Colors.light.text 
  },
  
  sleepInsightBox: { 
    marginTop: 16, 
    backgroundColor: Colors.light.background, 
    padding: 14, 
    borderRadius: 10, 
    width: '100%',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  sleepInsightTitle: { 
    fontSize: 12, 
    fontWeight: '700', 
    color: Colors.light.text, 
    marginBottom: 8 
  },
  sleepInsightText: { 
    fontSize: 11, 
    color: Colors.light.textSecondary, 
    lineHeight: 16 
  },
  
  emptyStateBox: { 
    alignItems: 'center', 
    paddingVertical: 40 
  },
  emptyStateEmoji: { 
    fontSize: 48, 
    marginBottom: 12 
  },
  emptyStateText: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: Colors.light.text, 
    marginBottom: 4 
  },
  emptyStateSubtext: { 
    fontSize: 11, 
    color: Colors.light.textSecondary 
  },

});


export default FitCalcChart;