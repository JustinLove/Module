module JS
  class Build
    def self.build(input, output)
      File.open(output, 'w') do |fout|
        File.open(input, 'r') do |fin|
          fin.each_line do |l|
            fout << l unless l.match('CGD.Module');
          end
        end
      end
    end
  end
end