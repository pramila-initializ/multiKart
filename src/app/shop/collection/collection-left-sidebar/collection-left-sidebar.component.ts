import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ViewportScroller } from '@angular/common';
import { ProductService } from "../../../shared/services/product.service";
import { Product } from '../../../shared/classes/product';

@Component({
  selector: 'app-collection-left-sidebar',
  templateUrl: './collection-left-sidebar.component.html',
  styleUrls: ['./collection-left-sidebar.component.scss']
})
export class CollectionLeftSidebarComponent implements OnInit {

  public grid: string = 'col-xl-3 col-md-6';
  public layoutView: string = 'grid-view';
  public products: Product[] = [];
  public displayProduct: Product[] = [];
  public productPaginated = [];
  public brands: any[] = [];
  public colors: any[] = [];
  public size: any[] = [];
  public minPrice: number = 0;
  public maxPrice: number = 1200;
  public tags: any[] = [];
  public category: string;
  public pageNo: number = 1;
  public paginate: any = {}; // Pagination use only
  public sortBy: string; // Sorting Order
  public mobileSidebar: boolean = false;
  public loader: boolean = true;
  conditionString: any;
  itemsPerPage: number = 16; // Adjust as needed
  currentPage: number = 1;
  loadFilteredProducts: any;
  displayingItems = 0;

  constructor(private route: ActivatedRoute, private router: Router,
    private viewScroller: ViewportScroller, public productService: ProductService) {
    // // Get Query params..
    this.route.queryParams.subscribe(params => {

    //   this.conditionString = params['category'];
    //   this.productService.getProductsByCategory(this.conditionString).subscribe((result: any) => {
    //     this.products = result.data;
    //   })
    this.brands = params.brand ? params.brand.split(",") : [];
    this.colors = params.color ? params.color.split(",") : [];
    this.size  = params.size ? params.size.split(",")  : [];
    this.minPrice = params.minPrice ? params.minPrice : this.minPrice;
    this.maxPrice = params.maxPrice ? params.maxPrice : this.maxPrice;
    this.tags = [...this.brands, ...this.colors, ...this.size]; // All Tags Array
    this.category = params.category ? params.category : null;
    this.sortBy = params.sortBy ? params.sortBy : 'ascending';
    this.pageNo = params.page ? params.page : this.pageNo;
    this.paginate = this.productService.getPager(this.products.length, this.pageNo);

      // Get Filtered Products..
      this.productService.filterProducts(this.tags).subscribe(response => {         
        if (response?.length > 0 ) {
        // Sorting Filter
        this.products = this.productService.sortProducts(response, this.sortBy);
        // Category Filter
        if(params.category)
          this.products = this.products.filter(item => item.type == this.category);
        // Price Filter
        this.products = this.products.filter(item => item.price >= this.minPrice && item.price <= this.maxPrice) 
        // Paginate Products
        this.paginate = this.productService.getPager(this.products.length, +this.pageNo);     // get paginate object from service
        this.products = this.products.slice(this.paginate.startIndex, this.paginate.endIndex + 1); // get current page of items
        }
      })
    })
  }

  ngOnInit(): void {
    // this.route.queryParams.subscribe(params => {
    //   // Accessing the 'condition' query parameter
    //   this.conditionString = params['category'];
    //   this.productService.getProductsByCategory(this.conditionString).subscribe((result: any) => {
    //     this.products = result.data;
    //   })
    // })

    this.route.queryParams.subscribe(params => {
      // Accessing the 'conditionString' query parameter to hit the required api's
      this.conditionString = params;
      const sortBy = params['sortBy'];
      const filterByBrand = params['brand'];
      if ((this.conditionString.category === 'Men') || (this.conditionString.category === 'Women')) {
        this.productService.getProductsByCategory(this.conditionString.category).subscribe((result: any) => {
          this.getProducts(result?.data, sortBy, filterByBrand);
        })
      } else if (this.conditionString.category === 'All Products') {
        this.productService.getProducts.subscribe((result: any) => {
          this.getProducts(result, sortBy, filterByBrand);
        })
      } else if (this.conditionString.searchTerm) {
        this.productService.searchProducts(this.conditionString.searchTerm).subscribe((result: any) => {
          this.getProducts(result?.data, sortBy, filterByBrand);
        })
      }
    })
  }

  // Get products list by category/ get products list of all products/ get products list by search
  getProducts(result, sortBy, filterByBrand) {
    if (result?.length > 0) {
      const res = [];
      let data = this.productService.sortProducts(result, sortBy);
      data = this.productService.filterByColor(data, this.conditionString.color);
      data = this.productService.filterByBrand(data, filterByBrand);
      while (data?.length > 0) {
        const chunk = data.splice(0, 16);
        res.push(chunk);
      }
      this.productPaginated = res;
      this.products = res.flat(1);
      this.paginate = this.productService.getPager(this.products.length, this.pageNo);
      this.displayProduct = this.productPaginated[parseInt(this.paginate.currentPage) - 1];
      this.productPaginated.forEach((element, index) => {
        if (index == parseInt(this.paginate.currentPage) - 1) {
          this.displayingItems = element.length;
        }
      });
    }
  }

  // Append filter value to Url
  updateFilter(tags: any) {
    tags.page = null; // Reset Pagination
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: tags,
      queryParamsHandling: 'merge', // preserve the existing query params in the route
      skipLocationChange: false  // do trigger navigation
    }).finally(() => {
      this.viewScroller.setOffset([120, 120]);
      this.viewScroller.scrollToAnchor('products'); // Anchore Link
    });
  }

  // SortBy Filter
  sortByFilter(value) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { sortBy: value ? value : null },
      queryParamsHandling: 'merge', // preserve the existing query params in the route
      skipLocationChange: false  // do trigger navigation
    }).finally(() => {
      this.viewScroller.setOffset([120, 120]);
      this.viewScroller.scrollToAnchor('products'); // Anchore Link
    });
  }

  // Remove Tag
  removeTag(tag: any) {

    this.brands = this.brands.filter(val => val !== tag);
    this.colors = this.colors.filter(val => val !== tag);
    this.size = this.size.filter(val => val !== tag);

    let params = {
      brand: this.brands.length ? this.brands.join(",") : null,
      color: this.colors.length ? this.colors.join(",") : null,
      size: this.size.length ? this.size.join(",") : null
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge', // preserve the existing query params in the route
      skipLocationChange: false  // do trigger navigation
    }).finally(() => {
      this.viewScroller.setOffset([120, 120]);
      this.viewScroller.scrollToAnchor('products'); // Anchore Link
    });
  }

  // Clear Tags
  removeAllTags() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      skipLocationChange: false  // do trigger navigation
    }).finally(() => {
      this.viewScroller.setOffset([120, 120]);
      this.viewScroller.scrollToAnchor('products'); // Anchore Link
    });
  }

  // product Pagination
  setPage(page: number) {
    this.displayProduct = this.productPaginated[parseInt(this.paginate.currentPage) - 1];
    this.productPaginated.forEach((element, index) => {
      if(index == parseInt(this.paginate.currentPage) - 1) {
        this.displayingItems = element.length;
      }
    })
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: page },
      queryParamsHandling: 'merge', // preserve the existing query params in the route
      skipLocationChange: false  // do trigger navigation
    }).finally(() => {
      this.viewScroller.setOffset([120, 120]);
      this.viewScroller.scrollToAnchor('products'); // Anchore Link
    });
  }

  // Change Grid Layout
  updateGridLayout(value: string) {
    this.grid = value;
  }

  // Change Layout View
  updateLayoutView(value: string) {
    this.layoutView = value;
    if (value == 'list-view')
      this.grid = 'col-lg-12';
    else
      this.grid = 'col-xl-3 col-md-6';
  }

  // Mobile sidebar
  toggleMobileSidebar() {
    this.mobileSidebar = !this.mobileSidebar;
  }

}
