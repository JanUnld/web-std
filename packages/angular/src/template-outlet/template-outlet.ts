import { NgClass, NgStyle } from '@angular/common';
import {
  Directive,
  DoCheck,
  ElementRef,
  EmbeddedViewRef,
  Input,
  IterableDiffers,
  KeyValueDiffers,
  NgModule,
  OnChanges,
  OnDestroy,
  Renderer2,
  SimpleChanges,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';

/* eslint-disable @angular-eslint/no-conflicting-lifecycle */
@Directive({
  selector: '[templateOutlet]',
  exportAs: 'templateOutlet',
})
export class TemplateOutlet<T = any> implements DoCheck, OnChanges, OnDestroy {
  private _viewRef: EmbeddedViewRef<T> | null = null;

  protected ngClasses: NgClass[] = [];
  protected ngStyles: NgStyle[] = [];

  @Input('templateOutlet') template?: TemplateRef<T>;
  @Input('templateOutletContext') context?: T;

  @Input('templateOutletNgClass') ngClass: NgClass['ngClass'];
  @Input('templateOutletNgStyle') ngStyle: NgStyle['ngStyle'];

  get viewRef(): EmbeddedViewRef<T> | null {
    return this._viewRef;
  }

  constructor(
    protected renderer: Renderer2,
    protected iterableDiffers: IterableDiffers,
    protected keyValueDiffers: KeyValueDiffers,
    protected viewContainerRef: ViewContainerRef
  ) {}

  ngDoCheck() {
    for (const ngClass of this.ngClasses) ngClass.ngDoCheck();
    for (const ngStyle of this.ngStyles) ngStyle.ngDoCheck();
  }
  ngOnChanges(changes: SimpleChanges) {
    const { context } = changes;
    const shouldRecreate = 'template' in changes || context.previousValue !== context.currentValue;

    if (shouldRecreate) {
      this.recreateViewRef();
      this.updateNgClasses();
      this.updateNgStyles();
    }
  }
  ngOnDestroy() {
    if (this._viewRef != null && !this._viewRef.destroyed) {
      this._viewRef.destroy();
      this._viewRef = null;
    }
  }

  protected updateNgClasses(rootNodes: any[] = this.viewRef?.rootNodes ?? []): void {
    this.ngClasses = [];
    if (this.ngClass != null && rootNodes.length > 0) {
      for (const node of rootNodes) {
        const ngClass = new NgClass(this.iterableDiffers, this.keyValueDiffers, new ElementRef(node), this.renderer);
        ngClass.ngClass = this.ngClass;
        this.ngClasses.push(ngClass);
      }
    }
  }
  protected updateNgStyles(rootNodes: any[] = this.viewRef?.rootNodes ?? []): void {
    this.ngStyles = [];
    if (this.ngStyle != null && rootNodes.length > 0) {
      for (const node of rootNodes) {
        const ngStyle = new NgStyle(new ElementRef(node), this.keyValueDiffers, this.renderer);
        ngStyle.ngStyle = this.ngStyle;
        this.ngStyles.push(ngStyle);
      }
    }
  }

  protected recreateViewRef() {
    this._viewRef?.destroy();
    if (this.template) {
      this._viewRef = this.viewContainerRef.createEmbeddedView(this.template, this.context);
    }
  }
  protected setViewRef(viewRef: EmbeddedViewRef<any>): void {
    if (viewRef instanceof EmbeddedViewRef) this._viewRef = viewRef;
  }
}

@NgModule({
  declarations: [TemplateOutlet],
  exports: [TemplateOutlet],
})
export class TemplateOutletModule {}
