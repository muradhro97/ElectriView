// Type definitions for the electrical plan data

export interface Point2D {
  X: number;
  Y: number;
  Z: number;
}

export interface Line2D {
  Start: Point2D;
  End: Point2D;
}

export interface Segment2D {
  Segment2D: {
    Start: Point2D;
    End: Point2D;
  };
}

export interface Route2D {
  StartPoint: Point2D;
  EndPoint: Point2D;
  Segments: Segment2D[];
}

export interface SingleRoute {
  Id: string;
  RunName: string;
  Family: string;
  Diameter: number;
  DiameterAsString: string;
  Usage: string;
  RouteColor: string;
  StartPanelId: number;
  Route2D: Route2D;
}

export interface Panel {
  Id: number;
  Lines2D: Line2D[];
}

export interface ViewLines {
  Other?: Line2D[];
  ElectricalEquipment?: Line2D[];
  ConduitFittings?: Line2D[];
  ElectricalFixture?: Line2D[];
}

export interface ElectricalPlanData {
  HRBoxFamily: any;
  ViewName: string;
  AllText: any[];
  ViewerOptions: {
    Spacing: number;
    W_Feet: number;
    W_Inch: number;
    E_Feet: number;
    E_Inch: number;
  };
  SingleRoutesInfoDict: {
    [key: string]: SingleRoute;
  };
  PanelsDataDict: {
    [key: string]: Panel;
  };
  ViewLines: ViewLines;
}
