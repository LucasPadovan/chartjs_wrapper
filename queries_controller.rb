class QueriesController < ApplicationController

  def query_data
    @questioner_type = params[:questioner_type]
    @channel         = params[:channel]
    @from_date       = params[:from_date].present? ? params[:from_date].to_date : (Date.today - 1.months)
    @to_date         = params[:to_date].present? ? params[:to_date].to_date : Date.today

    @queries      = Query.includes(:query_types).where('queries.created_at >= ? AND queries.created_at <= ?', @from_date, @to_date)
    @queries      = @queries.where(questioner_type: @questioner_type) if @questioner_type.present?
    @queries      = @queries.where(channel: @channel) if @channel.present?
    @queries      = @queries.select { |x| x.query_types.first.kind == params[:query_type] } if params[:query_type].present?
    @query_types  = @queries.map { |x| x.query_types }.flatten.delete_if { |query_type| query_type.description == 'other' }

    chart_parameters = case params[:wants]
                          when 'channels'
                            grouped_queries('channel')
                          when 'questioners'
                            grouped_queries('questioner_type')
                          when 'query', 'claim'
                            query_types_totals
                          when 'query_by_date', 'claim_by_date'
                            query_types_by_date
                        end

    query_data = {
      labels: chart_parameters[:labels],
      values: chart_parameters[:values],
      references: chart_parameters[:references],
      target: params[:target],
      chart_type: params[:chart_type]
    }

    respond_to do |format|
      format.json { render json: query_data.to_json }
    end
  end

  private

    def get_query
      @query = Query.find(params[:id])
      @questioner = @query.questioner
    end

    def apply_date_filter
      @from_date = params[:from_date].present? ? Time.zone.local_to_utc(params[:from_date].to_datetime).in_time_zone : ''
      @to_date = params[:to_date].present? ? Time.zone.local_to_utc(params[:to_date].to_datetime).in_time_zone.end_of_day : ''
      @queries = Query.includes(:query_types).where('queries.created_at >= ? AND queries.created_at <= ?', @from_date, @to_date )
    end

    def build_dates_range
      dates_ranges = []
      from_date    = (@from_date.day >= 29) ? @from_date - (@from_date.day - 28) : @from_date

      if @to_date <= from_date + 1.day + 3.months
        @diff = ( @to_date <= (from_date + 1.day + 1.month) ? 1 : 2 )
        while from_date.to_date < (@to_date - 1.day).to_date
          dates_ranges << from_date
          from_date    = from_date + @diff.weeks
        end
      else
        @diff = ( @to_date <= (from_date + 1.day + 2.years) ? -1 : -6 )
        while from_date.to_date < (@to_date - 1.day).to_date
          dates_ranges << from_date
          from_date    = from_date + @diff.abs.months
        end
      end
      dates_ranges << (@to_date - 1.day)

      dates_ranges
    end

    def grouped_queries(attribute)
      chart_parameters = {
          labels:     [],
          references: [],
          values:     [],
      }
      grouped_queries = @queries.group_by(&attribute.to_sym)

      grouped_queries.keys.each do |key|
        chart_parameters[:references] << t("customer_loyalty.queries.#{key}")
        chart_parameters[:values]     << grouped_queries[key].size
      end
      chart_parameters[:labels] = chart_parameters[:references]

      chart_parameters
    end

    def query_types_totals
      chart_parameters = {
          labels:     [],
          references: [],
          values:     [],
      }

      if @query_types.any?
        @query_types.uniq.each do |query_type|
          chart_parameters[:references] << query_type.translated_description
          chart_parameters[:values]     << @queries.select { |x| x.query_types.include?(query_type) }.size
        end
      end
      chart_parameters[:labels] = chart_parameters[:references]

      chart_parameters
    end

    def query_types_by_date
      chart_parameters = {
          labels:     [],
          references: [],
          values:     [],
      }

      dates_ranges = build_dates_range
      if @query_types.any?
        @query_types.uniq.each do |query_type|

          values = []
          dates_ranges[0..-2].each do |date|
            values << @queries.select { |x|
                        x.query_types.include?(query_type) &&
                        x.created_at < (date + 1.days) &&
                        x.created_at >= ((@diff < 0) ?
                          ((@diff.abs).months.ago(date) + 1.days) :
                          (@diff.weeks.ago(date) + 1.days))
                      }.size
          end

          values << @queries.select { |x|
                      x.query_types.include?(query_type) &&
                        x.created_at < (dates_ranges[-1] + 1.days) &&
                        x.created_at >= ((dates_ranges[-1] - dates_ranges[-2]).days.ago(dates_ranges[-1]))
                    }.size
          chart_parameters[:references] << query_type.translated_description
          chart_parameters[:values]     << values
        end
      end
      chart_parameters[:labels] = dates_ranges.map { |date| date.strftime('%d %b %Y') }

      chart_parameters
    end
end
