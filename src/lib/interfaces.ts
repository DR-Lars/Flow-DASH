export interface IBatchReport {
  uuid: string;
  timestamp: string;
  name: string;
  id: number;
  version: string;
  archive: string;
  snapshot: ISnapshot;
}

export interface ISnapshot {
  PN: string;
  SN: string;
  rnd: string;
  tags: ITags;
  ts: string;
}

export interface ITags {
  "BB_BATCHING!RUN1_PRODUCT_NAME": ITagValueString;
  "BB_Batching!RUN1_BATCH_APPROVED_MASS_CUR": ITagValueNumber;
  "BB_Batching!RUN1_BATCH_APPROVED_VOL_CUR": ITagValueNumber;
  "BB_Batching!RUN1_BATCH_NONACC_RATIO_MASS_CUR": ITagValueWithUnit;
  "BB_Batching!RUN1_BATCH_NONACC_RATIO_VOL_CUR": ITagValueWithUnit;
  "BB_MiMO!RUN1_LEFT_VOLT": ITagValueWithUnit;
  "BB_MiMO!RUN1_LIVE_ZERO": ITagValueWithUnit;
  "BB_MiMO!RUN1_MASS_TOTAL": ITagValueWithUnit;
  "BB_MiMO!RUN1_RIGHT_VOLT": ITagValueWithUnit;
  "BB_MiMO!RUN1_TUBE_FREQ": ITagValueWithUnit;
  "BB_MiMo!RUN1_AERATION_CUR": ITagValueWithUnit;
  "BB_MiMo!RUN1_DRIVE_GAIN": ITagValueWithUnit;
  "BB_MiMo!RUN1_LIQUID_DETECTOR": ITagValueBoolean;
  "LM_RUN1!RUN1_BATCH_NR_PRV": ITagValueNumber;
  "LM_RUN1!RUN1_GSV_ACC_BTOT_FWD_CUR": ITagValueWithUnit;
  "LM_RUN1!RUN1_GSV_NACC_BTOT_FWD_CUR": ITagValueWithUnit;
  "LM_RUN1!RUN1_GV_ACC_BTOT_FWD_CUR": ITagValueWithUnit;
  "LM_RUN1!RUN1_GV_NACC_BTOT_FWD_CUR": ITagValueWithUnit;
  "LM_RUN1!RUN1_MASS_ACC_BTOT_FWD_CUR": ITagValueWithUnit;
  "LM_RUN1!RUN1_MASS_NACC_BTOT_FWD_CUR": ITagValueWithUnit;
  "LM_RUN1!RUN1_MTR_MANUF": ITagValueString;
  "LM_RUN1!RUN1_MTR_MODEL": ITagValueString;
  "LM_RUN1!RUN1_MTR_SERIALNR": ITagValueNumber;
  "LM_RUN1!RUN1_MTR_SIZE": ITagValueString;
  "LM_Run1!RUN1_CPL_CUR": ITagValueWithUnit;
  "LM_Run1!RUN1_CTL_CUR": ITagValueWithUnit;
  "LM_Run1!RUN1_CTPL_CUR": ITagValueWithUnit;
  "LM_Run1!RUN1_DT_CUR": ITagValueWithUnit;
  "LM_Run1!RUN1_GSVR_CUR": ITagValueWithUnit;
  "LM_Run1!RUN1_GSV_BTOT_FWD_CUR": ITagValueWithUnit;
  "LM_Run1!RUN1_GSV_FWD_CUM": ITagValueWithUnit;
  "LM_Run1!RUN1_GVR_CUR": ITagValueWithUnit;
  "LM_Run1!RUN1_GV_BTOT_FWD_CUR": ITagValueWithUnit;
  "LM_Run1!RUN1_GV_FWD_CUM": ITagValueWithUnit;
  "LM_Run1!RUN1_MASSR_CUR": ITagValueWithUnit;
  "LM_Run1!RUN1_MASS_BTOT_FWD_CUR": ITagValueWithUnit;
  "LM_Run1!RUN1_MASS_FWD_CUM": ITagValueWithUnit;
  "LM_Run1!RUN1_MF_CUR": ITagValueWithUnit;
  "LM_Run1!RUN1_MKF_CUR": ITagValueWithUnit;
  "LM_Run1!RUN1_PT_CUR_GAUGE": ITagValueWithUnit;
  "LM_Run1!RUN1_SD_CUR": ITagValueWithUnit;
  "LM_Run1!RUN1_TT_CUR": ITagValueWithUnit;
  "SYS!SYS_COMPANY": ITagValueString;
  "SYS!SYS_DESCRIPTION": ITagValueString;
  "SYS!SYS_LOCATION": ITagValueString;
  "SYS!SYS_TAG": ITagValueString;
  "SYS!TIME_CUR": ITagValueString;
  "mod1_IO!PIN1_A_CUM": ITagValueNumber;
  "mod1_IO!PIN1_B_CUM": ITagValueNumber;
  "mod1_IO!PIN1_FRQ_A": ITagValueWithUnit;
  "mod1_IO!PIN1_FRQ_B": ITagValueWithUnit;
  "mod1_IO!PIN1_PHASEDIFF": ITagValueWithUnit;
}

export interface ITagValueWithUnit {
  u: string;
  v: number;
}

export interface ITagValueString {
  v: string;
}

export interface ITagValueNumber {
  v: number;
}

export interface ITagValueBoolean {
  v: boolean;
}
